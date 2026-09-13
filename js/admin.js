(() => {
  const baseData = structuredClone(window.CV_DATA);
  const $ = (id) => document.getElementById(id);
  let data = loadDraft() || baseData;
  let supabaseClient = null;
  let sessionMode = null;

  function safeParse(raw){ try{return raw?JSON.parse(raw):null}catch{return null} }
  function loadDraft(){ return safeParse(localStorage.getItem('cv_admin_draft')); }
  function saveDraft(){ localStorage.setItem('cv_admin_draft', JSON.stringify(data)); localStorage.setItem('cv_public_override', JSON.stringify({profile:data.profile})); }
  function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function config(){
    const local=safeParse(localStorage.getItem('cv_supabase_config'))||{};
    const shared=window.CV_SUPABASE_CONFIG||{};
    return local.url&&local.anon ? local : shared;
  }
  function adminEmailFromId(id){ const clean=String(id||'').replace(/\D/g,''); return clean ? `admin.${clean}@cv.jeffersonvillarreal.com` : ''; }

  function fillSupabaseFields(cfg){
    ['supabaseUrl','bootstrapSupabaseUrl'].forEach(id=>{ if($(id)) $(id).value=cfg.url||''; });
    ['supabaseAnon','bootstrapSupabaseAnon'].forEach(id=>{ if($(id)) $(id).value=cfg.anon||''; });
  }

  function initSupabase(){
    const cfg=config(); fillSupabaseFields(cfg);
    if(cfg.url && cfg.anon && window.supabase?.createClient){
      supabaseClient=window.supabase.createClient(cfg.url,cfg.anon);
      $('backendBadge').textContent='Supabase conectado'; $('backendBadge').className='badge success';
      return true;
    }
    supabaseClient=null;
    $('backendBadge').textContent='Supabase no conectado'; $('backendBadge').className='badge warning'; return false;
  }

  function persistSupabaseConfig(url,anon){
    if(!url || !anon){ alert('Completa la URL y la clave pública anon de Supabase.'); return false; }
    localStorage.setItem('cv_supabase_config',JSON.stringify({url,anon}));
    initSupabase();
    return true;
  }

  function openAdmin(mode){ sessionMode=mode; $('loginPanel').classList.add('hidden'); $('adminApp').classList.remove('hidden'); hydrateForms(); renderDashboard(); renderEvidence(); fillCvProfiles(); renderCV(); }

  async function login(e){
    e.preventDefault();
    if(!initSupabase()){ alert('Primero conecta Supabase desde “Conectar Supabase por primera vez”.'); return; }
    const email=adminEmailFromId($('loginId').value), password=$('loginPin').value;
    if(!email || !password) return;
    const {error}=await supabaseClient.auth.signInWithPassword({email,password});
    if(error){ alert('No se pudo iniciar sesión. Revisa la cédula, el PIN y la configuración de Supabase.'); return; }
    openAdmin('supabase');
  }

  function hydrateForms(){
    $('editName').value=data.profile.name||''; $('editNationalId').value=data.profile.nationalId||''; $('editHeadline').value=data.profile.headline||''; $('editEmail').value=data.profile.email||''; $('editPhone').value=data.profile.phone||''; $('editLinkedin').value=data.profile.linkedin||''; $('editWebsite').value=data.profile.website||''; $('editSummary').value=(data.profile.summary||[]).join('\n');
  }

  function collectProfile(){
    data.profile={...data.profile,name:$('editName').value.trim(),nationalId:$('editNationalId').value.trim(),headline:$('editHeadline').value.trim(),email:$('editEmail').value.trim(),phone:$('editPhone').value.trim(),linkedin:$('editLinkedin').value.trim(),website:$('editWebsite').value.trim(),summary:$('editSummary').value.split('\n').map(x=>x.trim()).filter(Boolean)};
  }

  function renderDashboard(){
    $('statsGrid').innerHTML=[['Experiencias',data.experience.length],['Títulos',data.education.length],['Cursos',data.courses.length],['CV especializados',data.cvProfiles.length]].map(([l,v])=>`<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('');
    $('profileChips').innerHTML=data.cvProfiles.map(p=>`<span class="chip">${escapeHtml(p.label)}</span>`).join('');
  }

  function fillCvProfiles(){ $('cvProfileSelect').innerHTML=data.cvProfiles.map(p=>`<option value="${p.id}">${escapeHtml(p.label)}</option>`).join(''); }

  function renderEvidence(){
    const educationOptions=data.education.map(x=>`<option value="education:${x.id}">Título · ${escapeHtml(x.degree)} · ${escapeHtml(x.field)}</option>`).join('');
    const courseOptions=data.courses.map(c=>`<option value="course:${c.id}">${escapeHtml(c.category)} · ${escapeHtml(c.title)}</option>`).join('');
    $('evidenceSelect').innerHTML=educationOptions+courseOptions;
    const educationRows=data.education.map(x=>`<div class="admin-list-row"><div><strong>${escapeHtml(x.degree)} · ${escapeHtml(x.field)}</strong><small>${escapeHtml(x.institution)} · Título académico</small></div><span class="badge ${x.evidence?'success':'warning'}">${x.evidence?'Cargado':'Sin archivo'}</span></div>`).join('');
    const courseRows=data.courses.map(c=>`<div class="admin-list-row"><div><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.issuer)} · ${escapeHtml(c.category)}</small></div><span class="badge ${c.url?'success':'warning'}">${c.url?'Cargado':'Sin archivo'}</span></div>`).join('');
    $('evidenceAdminList').innerHTML=educationRows+courseRows;
  }

  async function uploadEvidence(){
    if(!supabaseClient){ $('uploadMessage').textContent='Conecta Supabase primero.'; return; }
    const file=$('evidenceFile').files?.[0];
    const [type,id]=String($('evidenceSelect').value||'').split(':');
    const item=type==='education'?data.education.find(x=>x.id===id):data.courses.find(x=>x.id===id);
    if(!file||!item){$('uploadMessage').textContent='Selecciona un registro y un archivo.';return}
    $('uploadMessage').textContent='Subiendo…';
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'); const path=`${type}/${id}/${Date.now()}-${safeName}`;
    const {error}=await supabaseClient.storage.from('certificados').upload(path,file,{upsert:false});
    if(error){$('uploadMessage').textContent='Error: '+error.message;return}
    const {data:pub}=supabaseClient.storage.from('certificados').getPublicUrl(path);
    const publicUrl=pub.publicUrl;
    if(type==='education') item.evidence=publicUrl; else item.url=publicUrl;
    const {error:linkError}=await supabaseClient.from('evidence_links').upsert({entity_type:type,entity_id:id,public_url:publicUrl,updated_at:new Date().toISOString()},{onConflict:'entity_type,entity_id'});
    if(linkError){$('uploadMessage').textContent='Archivo cargado, pero no se pudo publicar el enlace: '+linkError.message;return}
    saveDraft(); renderEvidence(); $('uploadMessage').textContent='Archivo cargado y publicado en el perfil.';
  }

  function getAllSkills(){ return data.skills.flatMap(g=>g.items.map(i=>i.name)); }
  function experienceFor(profile){ return data.experience.map(x=>({ ...x, score:(x.tags||[]).filter(t=>profile.tags.includes(t)).length })).sort((a,b)=>b.score-a.score); }
  function selectedCourses(profile){ return profile.courseIds.map(id=>data.courses.find(c=>c.id===id)).filter(Boolean); }

  function renderCV(){
    const profile=data.cvProfiles.find(p=>p.id===$('cvProfileSelect').value)||data.cvProfiles[0]; if(!profile)return;
    const target=$('cvTarget').value.trim(); const experiences=experienceFor(profile); const skills=profile.skillKeywords.filter(k=>getAllSkills().includes(k)); const courses=selectedCourses(profile);
    const publicUrl=new URL('../', location.href).href;
    $('cvPreview').style.setProperty('--cv-accent',profile.theme);
    $('cvPreview').innerHTML=`
      <div class="cv-head">
        <img class="cv-photo" src="../assets/profile.svg" alt="Jefferson Villarreal"/>
        <div><h1>${escapeHtml(data.profile.name)}</h1><div class="cv-role">${escapeHtml(profile.title)}</div>${target?`<div class="pill">Enfoque: ${escapeHtml(target)}</div>`:''}<p class="cv-summary">${escapeHtml(profile.summary)}</p><div class="cv-contact"><span>${escapeHtml(data.profile.phone)}</span><span>${escapeHtml(data.profile.email)}</span>${data.profile.nationalId?`<span>C.I. ${escapeHtml(data.profile.nationalId)}</span>`:''}<span>${escapeHtml(data.profile.website)}</span></div></div>
      </div>
      <div class="cv-grid">
        <div>
          <section class="cv-section"><h2>Experiencia</h2>${experiences.map(x=>`<div class="cv-exp"><div class="cv-exp-top"><strong>${escapeHtml(x.role)} · ${escapeHtml(x.organization)}</strong><small>${escapeHtml(x.period)}</small></div><ul>${x.bullets.slice(0,x.score?2:1).map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul></div>`).join('')}</section>
        </div>
        <div>
          <section class="cv-section"><h2>Formación</h2>${data.education.map(x=>`<div class="cv-edu"><b>${escapeHtml(x.degree)} · ${escapeHtml(x.field)}</b><small>${escapeHtml(x.institution)} · ${escapeHtml(x.period)}${x.status?' · '+escapeHtml(x.status):''}</small></div>`).join('')}</section>
          <section class="cv-section"><h2>Competencias clave</h2><div class="cv-tags">${skills.map(s=>`<span class="cv-tag">${escapeHtml(s)}</span>`).join('')}</div></section>
          <section class="cv-section"><h2>Formación complementaria</h2>${courses.map(c=>`<div class="cv-course"><strong>${escapeHtml(c.title)}</strong><br><span>${escapeHtml(c.issuer)}</span></div>`).join('')}</section>
          <section class="cv-section"><h2>Idiomas</h2>${data.languages.map(x=>`<div class="cv-course"><strong>${escapeHtml(x.language)}</strong> · ${escapeHtml(x.level)}</div>`).join('')}</section>
        </div>
      </div>
      <div class="cv-footer"><p>Perfil completo, proyectos, publicaciones y certificados:<br><strong>${escapeHtml(publicUrl)}</strong></p><div id="qrBox" class="qr-box"></div></div>`;
    const qr=$('qrBox');
    if(window.QRCode?.toCanvas){const canvas=document.createElement('canvas');qr.appendChild(canvas);window.QRCode.toCanvas(canvas,publicUrl,{width:96,margin:0},()=>{});}else{qr.textContent='QR';}
  }

  document.querySelectorAll('.admin-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.admin-tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active'); $('tab-'+btn.dataset.tab).classList.add('active'); if(btn.dataset.tab==='cv')renderCV();
  }));

  $('loginForm').addEventListener('submit',login);
  $('logoutBtn').addEventListener('click',async()=>{if(sessionMode==='supabase'&&supabaseClient)await supabaseClient.auth.signOut();location.reload()});
  $('saveLocalBtn').addEventListener('click',()=>{collectProfile();saveDraft();alert('Borrador guardado en este dispositivo.');});
  $('uploadEvidenceBtn').addEventListener('click',uploadEvidence);
  $('renderCvBtn').addEventListener('click',renderCV);
  $('cvProfileSelect').addEventListener('change',renderCV);
  $('printCvBtn').addEventListener('click',()=>window.print());
  $('saveBootstrapConfigBtn').addEventListener('click',()=>{
    if(persistSupabaseConfig($('bootstrapSupabaseUrl').value.trim(),$('bootstrapSupabaseAnon').value.trim())) alert('Supabase quedó conectado en este dispositivo. Ya puedes iniciar sesión.');
  });
  $('saveSupabaseConfigBtn').addEventListener('click',()=>{
    if(persistSupabaseConfig($('supabaseUrl').value.trim(),$('supabaseAnon').value.trim())) alert('Conexión actualizada.');
  });

  initSupabase();
})();
