(() => {
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const uid=p=>(p||"item")+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
  let client=null,data=CVStore.clone(window.CV_DATA),editing={collection:null,index:null};

  const collections={
    education:{label:"Formación académica",title:x=>x.degree+" · "+x.field,fields:[
      ["id","ID","text"],["period","Período","text"],["degree","Título / nivel","text"],["field","Área / carrera","text"],["institution","Institución","text"],["status","Estado","text"],["tags","Etiquetas","csv"],["evidence","URL evidencia","text"]]},
    experience:{label:"Experiencia laboral",title:x=>x.role+" · "+x.organization,fields:[
      ["id","ID","text"],["role","Cargo","text"],["organization","Organización","text"],["period","Período","text"],["description","Descripción","textarea"],["bullets","Funciones / logros (una por línea)","lines"],["tags","Etiquetas","csv"]]},
    teachingExperience:{label:"Experiencia docente",title:x=>x.role+" · "+x.organization,fields:[
      ["id","ID","text"],["role","Cargo","text"],["organization","Institución","text"],["period","Período","text"],["description","Descripción","textarea"],["subjects","Asignaturas (una por línea)","lines"],["tags","Etiquetas","csv"],["evidence","URL evidencia","text"]]},
    skills:{label:"Competencias",title:x=>x.category,fields:[
      ["category","Categoría","text"],["items","Competencias (una por línea)","lines"],["tags","Etiquetas","csv"]]},
    courses:{label:"Cursos y certificados",title:x=>x.title+" · "+x.issuer,fields:[
      ["id","ID","text"],["category","Categoría","text"],["title","Curso","text"],["issuer","Institución","text"],["tags","Etiquetas","csv"],["url","URL certificado","text"]]},
    projects:{label:"Proyectos",title:x=>x.title,fields:[
      ["id","ID","text"],["title","Proyecto","text"],["description","Descripción","textarea"],["tags","Etiquetas","csv"],["url","URL evidencia","text"]]},
    publications:{label:"Publicaciones",title:x=>x.title,fields:[
      ["id","ID","text"],["type","Tipo","text"],["title","Título","text"],["description","Descripción","textarea"],["tags","Etiquetas","csv"],["url","URL","text"]]},
    languages:{label:"Idiomas",title:x=>x.language+" · "+x.level,fields:[
      ["id","ID","text"],["language","Idioma","text"],["level","Nivel","text"],["certificate","URL certificado","text"]]},
    references:{label:"Referencias",title:x=>x.name,fields:[
      ["id","ID","text"],["name","Nombre","text"],["role","Cargo / relación","text"],["phone","Teléfono","text"],["email","Correo","text"]]}
  };
  const profileSchema={label:"Tipo de CV",title:x=>x.label,fields:[
    ["id","Slug / enlace","text"],["label","Nombre corto","text"],["group","Grupo","text"],["title","Título del CV","text"],["summary","Resumen","textarea"],["tags","Etiquetas que prioriza","csv"],["theme","Color","color"],["active","Activo","checkbox"]]};

  function getConfig(){return CVStore.getConfig()}
  function adminEmailFromId(id){const clean=String(id||"").replace(/\D/g,"");return clean?`admin.${clean}@cv.jeffersonvillarreal.com`:""}
  function setBadge(ok){$("backendBadge").textContent=ok?"Supabase conectado":"Supabase no conectado";$("backendBadge").className="badge "+(ok?"success":"warning")}
  function initClient(){client=CVStore.getClient();setBadge(!!client);const cfg=getConfig();["supabaseUrl","bootstrapSupabaseUrl"].forEach(id=>$(id).value=cfg.url||"");["supabaseAnon","bootstrapSupabaseAnon"].forEach(id=>$(id).value=cfg.anon||"");return !!client}

  async function login(e){
    e.preventDefault();if(!initClient())return alert("Conecta Supabase primero.");
    const email=adminEmailFromId($("loginId").value),password=$("loginPin").value;
    const {error}=await client.auth.signInWithPassword({email,password});if(error)return alert("No se pudo iniciar sesión: "+error.message);
    const loaded=await CVStore.loadMaster(window.CV_DATA);data=loaded.data;$("loginPanel").classList.add("hidden");$("adminApp").classList.remove("hidden");$("publishBtn").classList.remove("hidden");hydrateProfile();renderAll();
  }
  async function publish(){
    applyProfile();try{await CVStore.saveMaster(client,data);localStorage.setItem("cv_master_draft",JSON.stringify(data));alert("Cambios publicados.");}catch(e){alert("No se pudo publicar: "+e.message)}
  }
  function hydrateProfile(){const p=data.profile||{};$("editName").value=p.name||"";$("editHeadline").value=p.headline||"";$("editEmail").value=p.email||"";$("editPhone").value=p.phone||"";$("editLinkedin").value=p.linkedin||"";$("editWebsite").value=p.website||"";$("editLocation").value=p.location||"";$("editSummary").value=(p.summary||[]).join("\n")}
  function applyProfile(){data.profile={...(data.profile||{}),name:$("editName").value.trim(),headline:$("editHeadline").value.trim(),email:$("editEmail").value.trim(),phone:$("editPhone").value.trim(),linkedin:$("editLinkedin").value.trim(),website:$("editWebsite").value.trim(),location:$("editLocation").value.trim(),summary:$("editSummary").value.split("\n").map(x=>x.trim()).filter(Boolean)};renderDashboard()}

  function renderDashboard(){
    const vals=[["Experiencias",(data.experience||[]).length],["Docencia",(data.teachingExperience||[]).length],["Formación",(data.education||[]).length],["Cursos",(data.courses||[]).length],["Proyectos",(data.projects||[]).length],["Publicaciones",(data.publications||[]).length],["Perfiles",(data.cvProfiles||[]).filter(x=>x.active!==false).length]];
    $("statsGrid").innerHTML=vals.map(([l,v])=>`<div class="stat"><strong>${v}</strong><span>${esc(l)}</span></div>`).join("");
    $("profileChips").innerHTML=(data.cvProfiles||[]).filter(p=>p.active!==false).map(p=>`<a class="chip" target="_blank" href="../${encodeURIComponent(p.id)}/">${esc(p.label)}</a>`).join("");
  }
  function initCollectionSelect(){
    $("collectionSelect").innerHTML=Object.entries(collections).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join("");
  }
  function renderContent(){
    const key=$("collectionSelect").value||Object.keys(collections)[0],schema=collections[key],arr=data[key]||[];
    $("contentList").innerHTML=arr.length?arr.map((x,i)=>`<div class="admin-list-row"><div><strong>${esc(schema.title(x))}</strong><small>${esc(x.period||x.category||x.type||"")}</small></div><button class="button ghost small edit-row" data-index="${i}">Editar</button></div>`).join(""):'<div class="card-panel"><p class="muted">No hay registros.</p></div>';
    document.querySelectorAll(".edit-row").forEach(b=>b.onclick=()=>openEditor(key,Number(b.dataset.index)));
  }
  function renderProfiles(){
    const arr=data.cvProfiles||[];$("profilesAdminList").innerHTML=arr.map((p,i)=>`<div class="admin-list-row"><div><strong>${esc(p.label)}</strong><small>/CV/${esc(p.id)}/ · ${esc(p.group||"")}</small></div><div class="row-actions"><span class="badge ${p.active!==false?"success":"warning"}">${p.active!==false?"Activo":"Oculto"}</span><button class="button ghost small profile-edit" data-index="${i}">Editar</button><a class="button ghost small" target="_blank" href="../${encodeURIComponent(p.id)}/">Abrir</a></div></div>`).join("");
    document.querySelectorAll(".profile-edit").forEach(b=>b.onclick=()=>openEditor("cvProfiles",Number(b.dataset.index)));
  }

  function fieldValue(obj,key,type){
    const v=obj?.[key];if(type==="csv")return Array.isArray(v)?v.join(", "):"";if(type==="lines")return Array.isArray(v)?v.join("\n"):"";if(type==="checkbox")return !!v;return v??"";
  }
  function openEditor(collection,index=null){
    const schema=collection==="cvProfiles"?profileSchema:collections[collection];const arr=data[collection]||(data[collection]=[]);const obj=index===null?{}:arr[index];
    editing={collection,index};$("editorTitle").textContent=(index===null?"Nuevo · ":"Editar · ")+schema.label;
    $("editorFields").innerHTML=schema.fields.map(([key,label,type])=>{
      const value=fieldValue(obj,key,type),id="fld-"+key;
      if(type==="textarea"||type==="lines")return `<label class="field-span-2">${esc(label)}<textarea id="${id}" rows="${type==="lines"?6:4}">${esc(value)}</textarea></label>`;
      if(type==="checkbox")return `<label class="checkbox-field"><input id="${id}" type="checkbox" ${value?"checked":""}/> ${esc(label)}</label>`;
      return `<label>${esc(label)}<input id="${id}" type="${type==="color"?"color":"text"}" value="${esc(value|| (type==="color"?"#1d4ed8":""))}" /></label>`;
    }).join("");
    $("deleteItemBtn").classList.toggle("hidden",index===null);$("editorDialog").showModal();
  }
  function saveEditor(){
    const collection=editing.collection,schema=collection==="cvProfiles"?profileSchema:collections[collection],arr=data[collection]||(data[collection]=[]),base=editing.index===null?{}:{...arr[editing.index]};
    schema.fields.forEach(([key,label,type])=>{const el=$("fld-"+key);let v=type==="checkbox"?el.checked:el.value.trim();if(type==="csv")v=v.split(",").map(x=>x.trim()).filter(Boolean);if(type==="lines")v=v.split("\n").map(x=>x.trim()).filter(Boolean);base[key]=v});
    if(!base.id && collection!=="skills")base.id=uid(collection.slice(0,4));
    if(editing.index===null)arr.push(base);else arr[editing.index]=base;$("editorDialog").close();renderAll();
  }
  function deleteEditor(){if(editing.index===null)return;const arr=data[editing.collection];if(confirm("¿Eliminar este registro?")){arr.splice(editing.index,1);$("editorDialog").close();renderAll()}}

  function fillEvidenceEntities(){
    const type=$("evidenceType").value,arr=data[type]||[];$("evidenceEntity").innerHTML=arr.map((x,i)=>`<option value="${i}">${esc(x.title||x.degree||x.role||x.name||("Registro "+(i+1)))}</option>`).join("");
  }
  async function uploadEvidence(){
    const f=$("evidenceFile").files?.[0];if(!client||!f)return alert("Selecciona archivo y conecta Supabase.");
    const type=$("evidenceType").value,index=Number($("evidenceEntity").value),item=data[type]?.[index];if(!item)return;
    const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"-"),path=`${type}/${item.id||index}/${Date.now()}-${safe}`;
    $("uploadMessage").textContent="Subiendo…";const {error}=await client.storage.from("evidencias-publicas").upload(path,f,{upsert:false});if(error){$("uploadMessage").textContent=error.message;return}
    const {data:pub}=client.storage.from("evidencias-publicas").getPublicUrl(path);const url=pub.publicUrl;
    if(type==="education"||type==="teachingExperience")item.evidence=url;else item.url=url;
    $("uploadMessage").textContent="Evidencia cargada. Pulsa Publicar cambios.";renderContent();
  }
  async function uploadPrivate(){
    const f=$("privateDocFile").files?.[0],name=$("privateDocName").value.trim()||f?.name;if(!client||!f)return alert("Selecciona un archivo.");
    const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"-"),path=`${Date.now()}-${safe}`;
    const {error}=await client.storage.from("documentos-privados").upload(path,f,{upsert:false,metadata:{title:name}});if(error)return alert(error.message);$("privateDocName").value="";$("privateDocFile").value="";await renderPrivateDocs();
  }
  async function renderPrivateDocs(){
    if(!client)return;$("privateDocsList").innerHTML='<p class="muted">Cargando…</p>';const {data:files,error}=await client.storage.from("documentos-privados").list("",{limit:100,sortBy:{column:"created_at",order:"desc"}});if(error){$("privateDocsList").innerHTML=`<p class="muted">${esc(error.message)}</p>`;return}
    $("privateDocsList").innerHTML=(files||[]).map(f=>`<div class="admin-list-row"><div><strong>${esc(f.name)}</strong><small>Documento privado</small></div><button class="button ghost small private-open" data-name="${esc(f.name)}">Abrir 5 min</button></div>`).join("");
    document.querySelectorAll(".private-open").forEach(b=>b.onclick=async()=>{const {data:s,error}=await client.storage.from("documentos-privados").createSignedUrl(b.dataset.name,300);if(error)return alert(error.message);window.open(s.signedUrl,"_blank","noopener")});
  }

  function fillCvProfiles(){$("cvProfileSelect").innerHTML=(data.cvProfiles||[]).filter(p=>p.active!==false).map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join("")}
  function renderCV(){
    const p=(data.cvProfiles||[]).find(x=>x.id===$("cvProfileSelect").value)||(data.cvProfiles||[])[0];if(!p)return;
    const target=$("cvTarget").value.trim(),exp=CVStore.relevant(data.experience,p,4),teach=CVStore.relevant(data.teachingExperience,p,2),skills=CVStore.relevant(data.skills,p,3).flatMap(g=>g.items||[]).slice(0,12),courses=CVStore.relevant(data.courses,p,6);
    const publicUrl=new URL("../"+p.id+"/",location.href).href;$("cvPreview").style.setProperty("--cv-accent",p.theme||"#1d4ed8");
    $("cvPreview").innerHTML=`<div class="cv-head"><img class="cv-photo" src="../assets/profile.svg"/><div><h1>${esc(data.profile.name)}</h1><div class="cv-role">${esc(p.title)}</div>${target?`<div class="pill">${esc(target)}</div>`:""}<p class="cv-summary">${esc(p.summary)}</p><div class="cv-contact"><span>${esc(data.profile.phone)}</span><span>${esc(data.profile.email)}</span><span>${esc(data.profile.website)}</span></div></div></div>
    <div class="cv-grid"><div><section class="cv-section"><h2>Experiencia</h2>${exp.map(x=>`<div class="cv-exp"><div class="cv-exp-top"><strong>${esc(x.role)} · ${esc(x.organization)}</strong><small>${esc(x.period)}</small></div><ul>${(x.bullets||[]).slice(0,2).map(b=>`<li>${esc(b)}</li>`).join("")}</ul></div>`).join("")}</section>
    ${teach.length?`<section class="cv-section"><h2>Docencia</h2>${teach.map(x=>`<div class="cv-exp"><strong>${esc(x.organization)}</strong><ul>${(x.subjects||[]).slice(0,5).map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`).join("")}</section>`:""}</div>
    <div><section class="cv-section"><h2>Formación</h2>${(data.education||[]).map(x=>`<div class="cv-edu"><b>${esc(x.degree)} · ${esc(x.field)}</b><small>${esc(x.institution)} · ${esc(x.period)}</small></div>`).join("")}</section><section class="cv-section"><h2>Competencias</h2><div class="cv-tags">${skills.map(s=>`<span class="cv-tag">${esc(typeof s==="string"?s:s.name)}</span>`).join("")}</div></section><section class="cv-section"><h2>Formación complementaria</h2>${courses.map(c=>`<div class="cv-course"><strong>${esc(c.title)}</strong><br><span>${esc(c.issuer)}</span></div>`).join("")}</section></div></div><div class="cv-footer"><p>Perfil completo y evidencias:<br><strong>${esc(publicUrl)}</strong></p><div id="qrBox" class="qr-box"></div></div>`;
    const qr=$("qrBox");if(window.QRCode?.toCanvas){const canvas=document.createElement("canvas");qr.appendChild(canvas);window.QRCode.toCanvas(canvas,publicUrl,{width:96,margin:0},()=>{})}
  }
  function renderAll(){renderDashboard();renderContent();renderProfiles();fillEvidenceEntities();fillCvProfiles();renderCV()}

  document.querySelectorAll(".admin-tabs button").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".admin-tabs button").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".admin-tab").forEach(t=>t.classList.remove("active"));btn.classList.add("active");$("tab-"+btn.dataset.tab).classList.add("active");if(btn.dataset.tab==="documents")renderPrivateDocs();if(btn.dataset.tab==="cv")renderCV()});
  $("loginForm").addEventListener("submit",login);$("logoutBtn").onclick=async()=>{if(client)await client.auth.signOut();location.reload()};$("publishBtn").onclick=publish;$("applyProfileBtn").onclick=applyProfile;
  $("collectionSelect").onchange=renderContent;$("addItemBtn").onclick=()=>openEditor($("collectionSelect").value,null);$("addProfileBtn").onclick=()=>openEditor("cvProfiles",null);
  $("saveItemBtn").onclick=saveEditor;$("deleteItemBtn").onclick=deleteEditor;$("closeEditorBtn").onclick=()=>$("editorDialog").close();
  $("evidenceType").onchange=fillEvidenceEntities;$("uploadEvidenceBtn").onclick=uploadEvidence;$("uploadPrivateBtn").onclick=uploadPrivate;
  $("renderCvBtn").onclick=renderCV;$("cvProfileSelect").onchange=renderCV;$("printCvBtn").onclick=()=>window.print();
  $("saveBootstrapConfigBtn").onclick=()=>{try{CVStore.persistConfig($("bootstrapSupabaseUrl").value.trim(),$("bootstrapSupabaseAnon").value.trim());initClient();alert("Conexión guardada.")}catch(e){alert(e.message)}};
  $("saveSupabaseConfigBtn").onclick=()=>{try{CVStore.persistConfig($("supabaseUrl").value.trim(),$("supabaseAnon").value.trim());initClient();alert("Conexión actualizada.")}catch(e){alert(e.message)}};
  initCollectionSelect();initClient();
})();