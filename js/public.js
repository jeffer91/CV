(() => {
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  let data;

  function render(){
    $("publicName").textContent=data.profile.name;
    $("publicHeadline").textContent=data.profile.headline;
    $("summaryBullets").innerHTML=(data.profile.summary||[]).map(x=>`<div><span>✓</span><p>${esc(x)}</p></div>`).join("");
    $("contactActions").innerHTML=[
      data.profile.email&&`<a class="button primary" href="mailto:${esc(data.profile.email)}">Correo</a>`,
      data.profile.phone&&`<a class="button secondary" target="_blank" rel="noopener" href="https://wa.me/593${esc(data.profile.phone.replace(/^0/,""))}">WhatsApp</a>`,
      data.profile.website&&`<a class="button ghost" target="_blank" rel="noopener" href="${esc(data.profile.website)}">Sitio web</a>`
    ].filter(Boolean).join("");

    const groups={};
    (data.cvProfiles||[]).filter(p=>p.active!==false).forEach(p=>(groups[p.group||"Otros"]??=[]).push(p));
    $("profileGroups").innerHTML=Object.entries(groups).map(([group,items])=>`
      <section class="profile-group"><h3>${esc(group)}</h3><div class="profile-grid">
        ${items.map(p=>`<a class="profile-card" href="./${encodeURIComponent(p.id)}/" style="--profile-accent:${esc(p.theme||"#1d4ed8")}">
          <span class="profile-dot"></span><strong>${esc(p.label)}</strong><small>${esc(p.title)}</small><p>${esc(p.summary)}</p><span class="profile-open">Abrir CV →</span>
        </a>`).join("")}
      </div></section>`).join("");

    $("experienceList").innerHTML=(data.experience||[]).slice(0,5).map((x,i)=>`
      <article class="timeline-item"><div class="timeline-marker">${String(i+1).padStart(2,"0")}</div><div class="timeline-card">
      <div class="item-top"><div><h3>${esc(x.role)}</h3><p class="muted strong">${esc(x.organization)}</p></div><span class="pill">${esc(x.period||"Trayectoria")}</span></div>
      <p>${esc(x.description)}</p></div></article>`).join("");

    $("educationGrid").innerHTML=(data.education||[]).map(x=>`<article class="info-card"><span class="pill">${esc(x.period)}</span><h3>${esc(x.degree)} · ${esc(x.field)}</h3><p>${esc(x.institution)}</p><small class="muted">${esc(x.status||"")}</small></article>`).join("");

    const featured=[...(data.projects||[]).slice(0,3),...(data.publications||[]).slice(0,3)];
    $("featuredGrid").innerHTML=featured.map(x=>`<article class="info-card"><p class="eyebrow">${esc(x.type||"Proyecto")}</p><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></article>`).join("");
  }

  async function init(){ const loaded=await CVStore.loadMaster(window.CV_DATA); data=loaded.data; render(); }
  init();
  $("menuBtn").addEventListener("click",()=>$("mainNav").classList.toggle("open"));
})();