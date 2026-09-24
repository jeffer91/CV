(() => {
  const esc = s => String(s ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const $ = id => document.getElementById(id);
  const slug = location.pathname.split("/").filter(Boolean).pop();
  let data, profile;

  const button = (url,label) => url ? `<a class="button ghost small" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>` : "";

  function list(items, renderer, empty="Sin información publicada."){
    return items?.length ? items.map(renderer).join("") : `<p class="muted">${esc(empty)}</p>`;
  }

  function render(){
    profile = (data.cvProfiles || []).find(p => p.id === slug && p.active !== false);
    if(!profile){
      document.title = "Perfil no disponible | Jefferson Villarreal";
      $("profileApp").innerHTML = '<section class="section-shell content-section"><h1>Perfil no disponible</h1><p>Este perfil no está activo.</p><a class="button primary" href="../">Volver al selector</a></section>';
      return;
    }

    document.documentElement.style.setProperty("--accent", profile.theme || "#1d4ed8");
    document.title = `${profile.label} | Jefferson Villarreal`;
    $("profileTitle").textContent = profile.title;
    $("profileSummary").textContent = profile.summary;
    $("profileName").textContent = data.profile.name;
    $("profileHeadline").textContent = data.profile.headline;
    $("profilePhoto").src = "../assets/profile.svg";

    const exp = CVStore.relevant(data.experience, profile, 6);
    const teach = CVStore.relevant(data.teachingExperience, profile, 4);
    const skills = CVStore.relevant(data.skills, profile, 6);
    const courses = CVStore.relevant(data.courses, profile, 10);
    const projects = CVStore.relevant(data.projects, profile, 6);
    const pubs = CVStore.relevant(data.publications, profile, 5);
    const education = [...(data.education || [])].sort((a,b)=>CVStore.matchTags(b,profile)-CVStore.matchTags(a,profile));

    $("contactActions").innerHTML = [
      data.profile.email && `<a class="button primary" href="mailto:${esc(data.profile.email)}">Correo</a>`,
      data.profile.phone && `<a class="button secondary" target="_blank" rel="noopener" href="https://wa.me/593${esc(data.profile.phone.replace(/^0/,""))}">WhatsApp</a>`,
      data.profile.website && `<a class="button ghost" target="_blank" rel="noopener" href="${esc(data.profile.website)}">Web</a>`
    ].filter(Boolean).join("");

    $("experienceList").innerHTML = list(exp, x => `
      <article class="timeline-item"><div class="timeline-marker"></div><div class="timeline-card">
        <div class="item-top"><div><h3>${esc(x.role)}</h3><p class="muted strong">${esc(x.organization)}</p></div><span class="pill">${esc(x.period || "Trayectoria")}</span></div>
        <p>${esc(x.description)}</p>
        ${x.bullets?.length ? `<ul>${x.bullets.slice(0,4).map(b=>`<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      </div></article>`);

    $("teachingList").innerHTML = list(teach, x => `
      <article class="info-card featured-card"><div class="item-top"><div><h3>${esc(x.role)}</h3><p class="muted strong">${esc(x.organization)}</p></div><span class="pill">${esc(x.period)}</span></div>
        <p>${esc(x.description)}</p>
        <div class="cv-tags">${(x.subjects||[]).map(s=>`<span class="cv-tag">${esc(s)}</span>`).join("")}</div>
        ${button(x.evidence,"Ver certificado")}
      </article>`);

    $("educationGrid").innerHTML = list(education, x => `
      <article class="info-card"><span class="pill">${esc(x.period)}</span><h3>${esc(x.degree)} · ${esc(x.field)}</h3><p>${esc(x.institution)}</p>
      ${x.status ? `<small class="muted">${esc(x.status)}</small>` : ""}${button(x.evidence,"Ver respaldo")}</article>`);

    $("skillsGrid").innerHTML = list(skills, x => `
      <article class="info-card"><h3>${esc(x.category)}</h3><div class="cv-tags">${(x.items||[]).map(s=>`<span class="cv-tag">${esc(typeof s==="string"?s:s.name)}</span>`).join("")}</div></article>`);

    $("coursesGrid").innerHTML = list(courses, x => `
      <article class="info-card compact-card"><p class="eyebrow">${esc(x.category)}</p><h3>${esc(x.title)}</h3><p>${esc(x.issuer)}</p>${button(x.url,"Certificado")}</article>`);

    $("projectsGrid").innerHTML = list(projects, x => `
      <article class="info-card"><p class="eyebrow">Proyecto</p><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>${button(x.url,"Evidencia")}</article>`);

    $("publicationsGrid").innerHTML = list(pubs, x => `
      <article class="info-card"><p class="eyebrow">${esc(x.type)}</p><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>${button(x.url,"Abrir")}</article>`);

    $("backToProfiles").href = "../";
    $("downloadHint").textContent = "Usa Imprimir / Guardar PDF para obtener una versión de este perfil.";
  }

  async function init(){
    const loaded = await CVStore.loadMaster(window.CV_DATA);
    data = loaded.data;
    render();
  }
  init();
})();