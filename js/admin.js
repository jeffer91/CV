(() => {
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const uid=p=>(p||"item")+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7);
  const clone=x=>CVStore.clone(x);
  let client=null,data=clone(window.CV_DATA),publishedData=clone(window.CV_DATA),editing={collection:null,index:null},placementEditing={collection:null,index:null},dirty=false;

  const collections={
    education:{label:"Formación académica",title:x=>x.degree+" · "+x.field,fields:[
      ["id","ID interno","text"],["period","Período","text"],["degree","Título / nivel","text"],["field","Área / carrera","text"],["institution","Institución","text"],["status","Estado","text"],["tags","Etiquetas","csv"],["evidence","URL evidencia","text"]]},
    experience:{label:"Experiencia laboral",title:x=>x.role+" · "+x.organization,fields:[
      ["id","ID interno","text"],["role","Cargo","text"],["organization","Organización","text"],["period","Período","text"],["description","Descripción general","textarea"],["bullets","Funciones / logros (una por línea)","lines"],["tags","Etiquetas","csv"],["evidence","URL evidencia","text"]]},
    teachingExperience:{label:"Experiencia docente",title:x=>x.role+" · "+x.organization,fields:[
      ["id","ID interno","text"],["role","Cargo","text"],["organization","Institución","text"],["period","Período","text"],["description","Descripción general","textarea"],["subjects","Asignaturas (una por línea)","lines"],["tags","Etiquetas","csv"],["evidence","URL evidencia","text"]]},
    skills:{label:"Competencias",title:x=>x.category,fields:[
      ["category","Categoría","text"],["items","Competencias (una por línea)","lines"],["tags","Etiquetas","csv"]]},
    courses:{label:"Cursos y certificados",title:x=>x.title+" · "+x.issuer,fields:[
      ["id","ID interno","text"],["category","Categoría","text"],["title","Curso","text"],["issuer","Institución","text"],["tags","Etiquetas","csv"],["url","URL certificado","text"]]},
    projects:{label:"Proyectos",title:x=>x.title,fields:[
      ["id","ID interno","text"],["title","Proyecto","text"],["description","Descripción general","textarea"],["tags","Etiquetas","csv"],["url","URL evidencia","text"]]},
    publications:{label:"Publicaciones",title:x=>x.title,fields:[
      ["id","ID interno","text"],["type","Tipo","text"],["title","Título","text"],["description","Descripción general","textarea"],["tags","Etiquetas","csv"],["url","URL / evidencia","text"]]},
    languages:{label:"Idiomas",title:x=>x.language+" · "+x.level,fields:[
      ["id","ID interno","text"],["language","Idioma","text"],["level","Nivel","text"],["certificate","URL certificado","text"]]},
    references:{label:"Referencias",title:x=>x.name,fields:[
      ["id","ID interno","text"],["name","Nombre","text"],["role","Cargo / relación","text"],["phone","Teléfono","text"],["email","Correo","text"]]}
  };
  const profileSchema={label:"Tipo de CV",title:x=>x.label,fields:[
    ["id","Slug / enlace","slug"],["label","Nombre corto","text"],["group","Grupo","text"],["title","Título del CV","text"],["summary","Resumen","textarea"],["tags","Etiquetas que prioriza","csv"],["theme","Color","color"],["active","Activo","checkbox"]]};

  function evidenceUrl(x){return x?.evidence||x?.url||x?.certificate||""}
  function adminEmailFromId(id){const clean=String(id||"").replace(/\D/g,"");return clean?`admin.${clean}@cv.jeffersonvillarreal.com`:""}
  function setBadge(ok){$("backendBadge").textContent=ok?"Supabase conectado":"Supabase no conectado";$("backendBadge").className="badge "+(ok?"success":"warning")}
  function setDirty(value=true){
    dirty=value;
    $("draftBadge").classList.remove("hidden");
    $("draftBadge").textContent=value?"Cambios sin publicar":"Publicado";
    $("draftBadge").className="badge "+(value?"warning":"success");
  }
  function initClient(){
    client=CVStore.getClient();setBadge(!!client);const cfg=CVStore.getConfig();
    ["supabaseUrl","bootstrapSupabaseUrl"].forEach(id=>{if($(id))$(id).value=cfg.url||""});
    ["supabaseAnon","bootstrapSupabaseAnon"].forEach(id=>{if($(id))$(id).value=cfg.anon||""});
    return !!client;
  }
  function showAdmin(){
    $("loginPanel").classList.add("hidden");$("adminApp").classList.remove("hidden");
    ["publishBtn","previewBtn","saveDraftBtn"].forEach(id=>$(id).classList.remove("hidden"));
    hydrateProfile();renderAll();renderHistory();
  }
  async function loadAdminData(){
    const loaded=await CVStore.loadMaster(window.CV_DATA);
    publishedData=clone(loaded.data);
    const draft=CVStore.getDraft();
    data=draft||clone(loaded.data);
    setDirty(!!draft);
  }
  async function login(e){
    e.preventDefault();if(!initClient())return alert("Primero conecta Supabase.");
    const email=adminEmailFromId($("loginId").value),password=$("loginPin").value;
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error)return alert("No se pudo iniciar sesión. Revisa la cédula, el PIN y la configuración de Supabase.");
    await loadAdminData();showAdmin();
  }
  async function tryExistingSession(){
    if(!initClient())return;
    const {data:s}=await client.auth.getSession();
    if(s?.session){await loadAdminData();showAdmin()}
  }

  function saveDraft(message=true){
    applyProfile(false);CVStore.saveDraft(data);setDirty(true);
    if(message)alert("Borrador guardado en este dispositivo. Todavía no es público.");
  }
  async function publish(){
    applyProfile(false);
    try{
      await CVStore.saveMaster(client,data);
      const {error}=await client.from("cv_history").insert({data:clone(data),note:"Publicación desde administrador"});
      if(error&&error.code!=="42P01")console.warn(error);
      publishedData=clone(data);CVStore.clearDraft();setDirty(false);renderDashboard();renderHistory();alert("Cambios publicados correctamente.");
    }catch(e){alert("No se pudo publicar: "+e.message)}
  }

  function hydrateProfile(){
    const p=data.profile||{};
    $("editName").value=p.name||"";$("editHeadline").value=p.headline||"";$("editEmail").value=p.email||"";$("editPhone").value=p.phone||"";
    $("editLinkedin").value=p.linkedin||"";$("editWebsite").value=p.website||"";$("editLocation").value=p.location||"";$("editSummary").value=(p.summary||[]).join("\n");
  }
  function applyProfile(mark=true){
    data.profile={...(data.profile||{}),name:$("editName").value.trim(),headline:$("editHeadline").value.trim(),email:$("editEmail").value.trim(),phone:$("editPhone").value.trim(),linkedin:$("editLinkedin").value.trim(),website:$("editWebsite").value.trim(),location:$("editLocation").value.trim(),summary:$("editSummary").value.split("\n").map(x=>x.trim()).filter(Boolean)};
    if(mark){markChanged()}else renderDashboard();
  }
  function markChanged(){CVStore.saveDraft(data);setDirty(true);renderDashboard()}

  function audit(){
    const requiredCollections=["education","experience","teachingExperience","courses","projects","publications"];
    let total=0,withEvidence=0,missingDates=0,manual=0;
    requiredCollections.forEach(k=>(data[k]||[]).forEach(x=>{total++;if(evidenceUrl(x))withEvidence++;if((k==="experience"||k==="teachingExperience")&&!String(x.period||"").trim())missingDates++;if(x.assignmentMode==="manual")manual++}));
    const missingEvidence=Math.max(total-withEvidence,0);
    const activeProfiles=(data.cvProfiles||[]).filter(p=>p.active!==false).length;
    const pct=total?Math.round(withEvidence/total*100):100;
    return{total,withEvidence,missingEvidence,missingDates,manual,activeProfiles,pct};
  }
  function renderDashboard(){
    const a=audit();
    const vals=[["Experiencias",(data.experience||[]).length],["Docencia",(data.teachingExperience||[]).length],["Títulos",(data.education||[]).length],["Cursos",(data.courses||[]).length],["Proyectos",(data.projects||[]).length],["Publicaciones",(data.publications||[]).length],["CV activos",a.activeProfiles],["Evidencias",a.withEvidence+"/"+a.total]];
    $("statsGrid").innerHTML=vals.map(([l,v])=>`<div class="stat"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join("");
    $("completionBadge").textContent=a.pct+"% con respaldo";$("completionBadge").className="badge "+(a.pct>=80?"success":"warning");
    const issues=[
      [a.missingEvidence,`${a.missingEvidence} registros sin evidencia vinculada`],
      [a.missingDates,`${a.missingDates} experiencias sin período completo`],
      [(data.cvProfiles||[]).filter(p=>p.active===false).length,`${(data.cvProfiles||[]).filter(p=>p.active===false).length} perfiles ocultos`],
      [a.manual,`${a.manual} registros con asignación manual por CV`]
    ];
    $("issuesList").innerHTML=issues.map(([n,t])=>`<div class="check-row ${n===0?"ok":""}"><span>${n===0?"✓":"!"}</span><div><strong>${esc(t)}</strong><small>${n===0?"Sin pendientes en este criterio.":"Revisa desde Contenido o Documentos."}</small></div></div>`).join("");
    $("profileChips").innerHTML=(data.cvProfiles||[]).filter(p=>p.active!==false).map(p=>`<a class="chip" target="_blank" href="../${encodeURIComponent(p.id)}/">${esc(p.label)}</a>`).join("");
  }
  async function renderHistory(){
    if(!client||!$("historyList"))return;
    const {data:rows,error}=await client.from("cv_history").select("id,published_at,note,data").order("published_at",{ascending:false}).limit(10);
    if(error){$("historyList").innerHTML='<p class="muted">El historial estará disponible después de ejecutar la versión actualizada de supabase/schema.sql.</p>';return}
    $("historyList").innerHTML=(rows||[]).length?(rows||[]).map(r=>`<div class="admin-list-row"><div><strong>${new Date(r.published_at).toLocaleString("es-EC")}</strong><small>${esc(r.note||"Publicación")}</small></div><button class="button ghost small restore-history" data-id="${r.id}">Restaurar como borrador</button></div>`).join(""):'<p class="muted">Aún no hay publicaciones registradas.</p>';
    document.querySelectorAll(".restore-history").forEach(b=>b.onclick=()=>{const row=rows.find(r=>String(r.id)===String(b.dataset.id));if(!row)return;data=clone(row.data);hydrateProfile();renderAll();markChanged();alert("Versión recuperada como borrador. Revísala antes de publicar.")});
  }

  function initCollectionSelect(){$("collectionSelect").innerHTML=Object.entries(collections).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join("")}
  function assignmentLabel(x){
    if(x.assignmentMode!=="manual")return'<span class="badge neutral">Automático</span>';
    const n=Object.values(x.placements||{}).filter(p=>p?.enabled).length;
    return `<span class="badge info">Manual · ${n} CV</span>`;
  }
  function renderContent(){
    const key=$("collectionSelect").value||Object.keys(collections)[0],schema=collections[key],arr=data[key]||[];
    $("contentList").innerHTML=arr.length?arr.map((x,i)=>`<div class="admin-list-row content-row">
      <div class="content-row-main"><strong>${esc(schema.title(x))}</strong><small>${esc(x.period||x.category||x.type||"")}</small><div class="row-badges">${x.visible===false?'<span class="badge warning">Oculto</span>':'<span class="badge success">Visible</span>'}${evidenceUrl(x)?'<span class="badge success">Con evidencia</span>':'<span class="badge warning">Sin evidencia</span>'}${assignmentLabel(x)}</div></div>
      <div class="row-actions"><button class="button secondary small assign-row" data-index="${i}">Asignar CV</button><button class="button ghost small edit-row" data-index="${i}">Editar</button></div>
    </div>`).join(""):'<div class="card-panel"><p class="muted">No hay registros en esta sección.</p></div>';
    document.querySelectorAll(".edit-row").forEach(b=>b.onclick=()=>openEditor(key,Number(b.dataset.index)));
    document.querySelectorAll(".assign-row").forEach(b=>b.onclick=()=>openPlacement(key,Number(b.dataset.index)));
  }
  function renderProfiles(){
    const arr=data.cvProfiles||[];
    $("profilesAdminList").innerHTML=arr.map((p,i)=>`<div class="admin-list-row"><div><strong>${esc(p.label)}</strong><small>/CV/${esc(p.id)}/ · ${esc(p.group||"")}</small></div><div class="row-actions"><span class="badge ${p.active!==false?"success":"warning"}">${p.active!==false?"Activo":"Oculto"}</span><button class="button ghost small profile-edit" data-index="${i}">Editar</button><a class="button ghost small" target="_blank" href="../${encodeURIComponent(p.id)}/">Abrir</a></div></div>`).join("");
    document.querySelectorAll(".profile-edit").forEach(b=>b.onclick=()=>openEditor("cvProfiles",Number(b.dataset.index)));
  }

  function fieldValue(obj,key,type){
    const v=obj?.[key];if(type==="csv")return Array.isArray(v)?v.join(", "):"";if(type==="lines")return Array.isArray(v)?v.join("\n"):"";if(type==="checkbox")return !!v;return v??"";
  }
  function openEditor(collection,index=null){
    const schema=collection==="cvProfiles"?profileSchema:collections[collection],arr=data[collection]||(data[collection]=[]),obj=index===null?{}:arr[index];
    editing={collection,index};$("editorTitle").textContent=(index===null?"Nuevo · ":"Editar · ")+schema.label;
    $("editorFields").innerHTML=schema.fields.map(([key,label,type])=>{
      const value=fieldValue(obj,key,type),id="fld-"+key;
      if(type==="textarea"||type==="lines")return `<label class="field-span-2">${esc(label)}<textarea id="${id}" rows="${type==="lines"?6:4}">${esc(value)}</textarea></label>`;
      if(type==="checkbox")return `<label class="checkbox-field"><input id="${id}" type="checkbox" ${value?"checked":""}/> ${esc(label)}</label>`;
      return `<label>${esc(label)}<input id="${id}" type="${type==="color"?"color":"text"}" value="${esc(value||(type==="color"?"#1d4ed8":""))}" /></label>`;
    }).join("")+(collection!=="cvProfiles"?`<label class="checkbox-field field-span-2"><input id="fld-visible" type="checkbox" ${obj.visible!==false?"checked":""}/> Visible globalmente</label>`:"");
    $("deleteItemBtn").classList.toggle("hidden",index===null);$("editorDialog").showModal();
  }
  function saveEditor(){
    const collection=editing.collection,schema=collection==="cvProfiles"?profileSchema:collections[collection],arr=data[collection]||(data[collection]=[]),base=editing.index===null?{}:{...arr[editing.index]};
    schema.fields.forEach(([key,label,type])=>{const el=$("fld-"+key);let v=type==="checkbox"?el.checked:el.value.trim();if(type==="csv")v=v.split(",").map(x=>x.trim()).filter(Boolean);if(type==="lines")v=v.split("\n").map(x=>x.trim()).filter(Boolean);if(type==="slug")v=v.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"");base[key]=v});
    if(collection!=="cvProfiles")base.visible=$("fld-visible").checked;
    if(!base.id&&collection!=="skills")base.id=uid(collection.slice(0,4));
    if(editing.index===null)arr.push(base);else arr[editing.index]=base;
    $("editorDialog").close();renderAll();markChanged();
  }
  function deleteEditor(){
    if(editing.index===null)return;
    if(confirm("¿Eliminar este registro? Esta acción quedará en el borrador hasta publicar.")){data[editing.collection].splice(editing.index,1);$("editorDialog").close();renderAll();markChanged()}
  }

  function openPlacement(collection,index){
    const item=data[collection][index],profiles=(data.cvProfiles||[]).filter(p=>p.active!==false);
    placementEditing={collection,index};$("placementTitle").textContent="Asignar · "+(collections[collection]?.title(item)||"Registro");
    const manual=item.assignmentMode==="manual",placements=item.placements||{};
    $("placementList").innerHTML=profiles.map(p=>{
      const existing=placements[p.id],suggested=!manual&&CVStore.matchTags(item,p)>0,checked=existing?.enabled===true||suggested;
      const priority=existing?.priority||"medium",order=existing?.order??99,text=existing?.text||"";
      return `<div class="placement-row" data-profile="${esc(p.id)}">
        <label class="placement-check"><input class="pl-enabled" type="checkbox" ${checked?"checked":""}/><span><strong>${esc(p.label)}</strong><small>/CV/${esc(p.id)}/</small></span></label>
        <label>Prioridad<select class="pl-priority"><option value="high" ${priority==="high"?"selected":""}>Alta</option><option value="medium" ${priority==="medium"?"selected":""}>Media</option><option value="low" ${priority==="low"?"selected":""}>Baja</option></select></label>
        <label>Orden<input class="pl-order" type="number" min="1" max="99" value="${esc(order)}"/></label>
        <label class="placement-text">Texto específico para este CV<input class="pl-text" value="${esc(text)}" placeholder="Opcional: descripción distinta para este perfil"/></label>
      </div>`;
    }).join("");
    $("placementDialog").showModal();
  }
  function savePlacement(){
    const item=data[placementEditing.collection][placementEditing.index],placements={};
    document.querySelectorAll(".placement-row").forEach(row=>{
      const id=row.dataset.profile,enabled=row.querySelector(".pl-enabled").checked;
      if(enabled)placements[id]={enabled:true,priority:row.querySelector(".pl-priority").value,order:Number(row.querySelector(".pl-order").value)||99,text:row.querySelector(".pl-text").value.trim()};
    });
    item.assignmentMode="manual";item.placements=placements;$("placementDialog").close();renderContent();markChanged();
  }
  function automaticPlacement(){
    const item=data[placementEditing.collection][placementEditing.index];
    delete item.assignmentMode;delete item.placements;$("placementDialog").close();renderContent();markChanged();
  }

  function fillEvidenceEntities(){
    const type=$("evidenceType").value,arr=data[type]||[];
    $("evidenceEntity").innerHTML=arr.map((x,i)=>`<option value="${i}">${esc(x.title||x.degree||x.role||x.name||("Registro "+(i+1)))}</option>`).join("");
  }
  async function uploadEvidence(){
    const f=$("evidenceFile").files?.[0];if(!client||!f)return alert("Selecciona un archivo y conecta Supabase.");
    const type=$("evidenceType").value,index=Number($("evidenceEntity").value),item=data[type]?.[index];if(!item)return;
    const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"-"),path=`${type}/${item.id||index}/${Date.now()}-${safe}`;
    $("uploadMessage").textContent="Subiendo…";
    const {error}=await client.storage.from("evidencias-publicas").upload(path,f,{upsert:false});if(error){$("uploadMessage").textContent="Error: "+error.message;return}
    const {data:pub}=client.storage.from("evidencias-publicas").getPublicUrl(path),url=pub.publicUrl;
    if(type==="education"||type==="experience"||type==="teachingExperience")item.evidence=url;else item.url=url;
    $("uploadMessage").textContent="Evidencia cargada y vinculada. Falta publicar el borrador.";renderAll();markChanged();
  }
  async function uploadPrivate(){
    const f=$("privateDocFile").files?.[0],title=$("privateDocName").value.trim()||f?.name;if(!client||!f)return alert("Selecciona un archivo.");
    const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"-"),path=`${Date.now()}-${safe}`;
    const {error}=await client.storage.from("documentos-privados").upload(path,f,{upsert:false,metadata:{title}});
    if(error)return alert(error.message);
    $("privateDocName").value="";$("privateDocFile").value="";await renderPrivateDocs();
  }
  async function renderPrivateDocs(){
    if(!client)return;
    $("privateDocsList").innerHTML='<p class="muted">Cargando…</p>';
    const {data:files,error}=await client.storage.from("documentos-privados").list("",{limit:100,sortBy:{column:"created_at",order:"desc"}});
    if(error){$("privateDocsList").innerHTML=`<p class="muted">${esc(error.message)}</p>`;return}
    $("privateDocsList").innerHTML=(files||[]).length?(files||[]).map(f=>`<div class="admin-list-row"><div><strong>${esc(f.metadata?.title||f.name)}</strong><small>Documento privado · ${esc(f.name)}</small></div><button class="button ghost small private-open" data-name="${esc(f.name)}">Abrir 5 min</button></div>`).join(""):'<p class="muted">No hay documentos privados cargados.</p>';
    document.querySelectorAll(".private-open").forEach(b=>b.onclick=async()=>{const {data:s,error}=await client.storage.from("documentos-privados").createSignedUrl(b.dataset.name,300);if(error)return alert(error.message);window.open(s.signedUrl,"_blank","noopener")});
  }

  function fillCvProfiles(){$("cvProfileSelect").innerHTML=(data.cvProfiles||[]).filter(p=>p.active!==false).map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join("")}
  function renderCV(){
    const p=(data.cvProfiles||[]).find(x=>x.id===$("cvProfileSelect").value)||(data.cvProfiles||[]).find(x=>x.active!==false);if(!p)return;
    const target=$("cvTarget").value.trim(),exp=CVStore.relevant(data.experience,p,4),teach=CVStore.relevant(data.teachingExperience,p,2),skills=CVStore.relevant(data.skills,p,3).flatMap(g=>g.items||[]).slice(0,12),courses=CVStore.relevant(data.courses,p,6),education=CVStore.rankAll(data.education,p,5);
    const publicUrl=new URL("../"+p.id+"/",location.href).href;$("cvPreview").style.setProperty("--cv-accent",p.theme||"#1d4ed8");
    $("cvPreview").innerHTML=`<div class="cv-head"><img class="cv-photo" src="../assets/profile.svg" alt="Jefferson Villarreal"/><div><h1>${esc(data.profile.name)}</h1><div class="cv-role">${esc(p.title)}</div>${target?`<div class="pill">Enfoque: ${esc(target)}</div>`:""}<p class="cv-summary">${esc(p.summary)}</p><div class="cv-contact"><span>${esc(data.profile.phone)}</span><span>${esc(data.profile.email)}</span><span>${esc(data.profile.website)}</span></div></div></div>
    <div class="cv-grid"><div><section class="cv-section"><h2>Experiencia</h2>${exp.map(x=>`<div class="cv-exp"><div class="cv-exp-top"><strong>${esc(x.role)} · ${esc(x.organization)}</strong><small>${esc(x.period)}</small></div>${x._customText?`<p class="cv-mini">${esc(x._customText)}</p>`:`<ul>${(x.bullets||[]).slice(0,2).map(b=>`<li>${esc(b)}</li>`).join("")}</ul>`}</div>`).join("")}</section>
    ${teach.length?`<section class="cv-section"><h2>Docencia</h2>${teach.map(x=>`<div class="cv-exp"><strong>${esc(x.organization)}</strong>${x._customText?`<p class="cv-mini">${esc(x._customText)}</p>`:`<ul>${(x.subjects||[]).slice(0,5).map(s=>`<li>${esc(s)}</li>`).join("")}</ul>`}</div>`).join("")}</section>`:""}</div>
    <div><section class="cv-section"><h2>Formación</h2>${education.map(x=>`<div class="cv-edu"><b>${esc(x.degree)} · ${esc(x.field)}</b><small>${esc(x.institution)} · ${esc(x.period)}</small></div>`).join("")}</section><section class="cv-section"><h2>Competencias</h2><div class="cv-tags">${skills.map(s=>`<span class="cv-tag">${esc(typeof s==="string"?s:s.name)}</span>`).join("")}</div></section><section class="cv-section"><h2>Formación complementaria</h2>${courses.map(c=>`<div class="cv-course"><strong>${esc(c.title)}</strong><br><span>${esc(c.issuer)}</span></div>`).join("")}</section></div></div><div class="cv-footer"><p>Perfil completo, proyectos y evidencias:<br><strong>${esc(publicUrl)}</strong></p><div id="qrBox" class="qr-box"></div></div>`;
    const qr=$("qrBox");if(window.QRCode?.toCanvas){const canvas=document.createElement("canvas");qr.appendChild(canvas);window.QRCode.toCanvas(canvas,publicUrl,{width:96,margin:0},()=>{})}
  }
  function showPreview(){
    document.querySelectorAll(".admin-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab==="cv"));
    document.querySelectorAll(".admin-tab").forEach(t=>t.classList.toggle("active",t.id==="tab-cv"));
    fillCvProfiles();renderCV();window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderAll(){renderDashboard();renderContent();renderProfiles();fillEvidenceEntities();fillCvProfiles();renderCV()}

  document.querySelectorAll(".admin-tabs button").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".admin-tabs button").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".admin-tab").forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");$("tab-"+btn.dataset.tab).classList.add("active");
    if(btn.dataset.tab==="documents")renderPrivateDocs();if(btn.dataset.tab==="cv")renderCV();if(btn.dataset.tab==="dashboard")renderHistory();
  }));
  $("loginForm").addEventListener("submit",login);$("logoutBtn").addEventListener("click",async()=>{if(client)await client.auth.signOut();location.reload()});
  $("saveDraftBtn").onclick=()=>saveDraft(true);$("previewBtn").onclick=showPreview;$("publishBtn").onclick=publish;$("applyProfileBtn").onclick=()=>applyProfile(true);
  $("collectionSelect").onchange=renderContent;$("addItemBtn").onclick=()=>openEditor($("collectionSelect").value,null);$("addProfileBtn").onclick=()=>openEditor("cvProfiles",null);
  $("saveItemBtn").onclick=saveEditor;$("deleteItemBtn").onclick=deleteEditor;$("closeEditorBtn").onclick=()=>$("editorDialog").close();
  $("closePlacementBtn").onclick=()=>$("placementDialog").close();$("savePlacementBtn").onclick=savePlacement;$("automaticPlacementBtn").onclick=automaticPlacement;
  $("evidenceType").onchange=fillEvidenceEntities;$("uploadEvidenceBtn").onclick=uploadEvidence;$("uploadPrivateBtn").onclick=uploadPrivate;
  $("renderCvBtn").onclick=renderCV;$("cvProfileSelect").onchange=renderCV;$("printCvBtn").onclick=()=>window.print();$("refreshHistoryBtn").onclick=renderHistory;
  $("saveBootstrapConfigBtn").onclick=()=>{try{CVStore.persistConfig($("bootstrapSupabaseUrl").value.trim(),$("bootstrapSupabaseAnon").value.trim());initClient();alert("Supabase quedó conectado en este dispositivo.")}catch(e){alert(e.message)}};
  $("saveSupabaseConfigBtn").onclick=()=>{try{CVStore.persistConfig($("supabaseUrl").value.trim(),$("supabaseAnon").value.trim());initClient();alert("Conexión actualizada.")}catch(e){alert(e.message)}};

  initCollectionSelect();initClient();tryExistingSession();
})();