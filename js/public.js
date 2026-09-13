(() => {
  const base = window.CV_DATA;
  const saved = safeParse(localStorage.getItem('cv_public_override'));
  const data = saved ? mergeData(structuredClone(base), saved) : base;
  const $ = (id) => document.getElementById(id);
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function safeParse(raw){ try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
  function mergeData(target, patch){
    if (patch?.profile) target.profile = {...target.profile, ...patch.profile};
    return target;
  }
  function linkButton(url, label){ return url ? `<a class="text-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : ''; }

  $('summaryBullets').innerHTML = data.profile.summary.map(x => `<div><span>✓</span><p>${esc(x)}</p></div>`).join('');
  $('contactActions').innerHTML = [
    data.profile.email && `<a class="button primary" href="mailto:${esc(data.profile.email)}">Correo</a>`,
    data.profile.phone && `<a class="button secondary" href="https://wa.me/593${esc(data.profile.phone.replace(/^0/,''))}" target="_blank" rel="noopener">WhatsApp</a>`,
    data.profile.linkedin && `<a class="button ghost" href="${esc(data.profile.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`
  ].filter(Boolean).join('');

  $('experienceList').innerHTML = data.experience.map((x,i) => `
    <article class="timeline-item">
      <div class="timeline-marker">${String(i+1).padStart(2,'0')}</div>
      <div class="timeline-card">
        <div class="item-top"><div><h3>${esc(x.role)}</h3><p class="muted strong">${esc(x.organization)}</p></div><span class="pill">${esc(x.period || 'Trayectoria')}</span></div>
        <p>${esc(x.description)}</p>
        <details><summary>Ver funciones destacadas</summary><ul>${x.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul></details>
      </div>
    </article>`).join('');

  $('educationGrid').innerHTML = data.education.map(x => `
    <article class="info-card featured-card">
      <span class="pill">${esc(x.period)}</span><h3>${esc(x.degree)} · ${esc(x.field)}</h3><p>${esc(x.institution)}</p>
      ${x.status ? `<p class="muted">${esc(x.status)}</p>` : ''}${linkButton(x.evidence, 'Ver título / evidencia')}
    </article>`).join('');

  $('skillsGrid').innerHTML = data.skills.map(group => `
    <article class="info-card"><h3>${esc(group.category)}</h3><div class="skill-list">${group.items.map(item => `<div class="skill-row"><span>${esc(item.name)}</span>${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">Evidencia ↗</a>` : ''}</div>`).join('')}</div></article>`).join('');

  const card = (x, meta='') => `<article class="info-card"><p class="eyebrow">${esc(meta)}</p><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p>${linkButton(x.url, 'Abrir evidencia')}</article>`;
  $('projectsGrid').innerHTML = data.projects.map(x => card(x, 'Proyecto')).join('');
  $('publicationsGrid').innerHTML = data.publications.map(x => card(x, x.type)).join('');

  const groups = Object.groupBy ? Object.groupBy(data.courses, x=>x.category) : data.courses.reduce((a,x)=>((a[x.category] ||= []).push(x),a),{});
  $('coursesGroups').innerHTML = Object.entries(groups).map(([category, items], idx) => `
    <details class="accordion" ${idx===0?'open':''}>
      <summary><span>${esc(category)}</span><span class="count">${items.length}</span></summary>
      <div class="accordion-body">${items.map(c => `<div class="course-row"><div><strong>${esc(c.title)}</strong><small>${esc(c.issuer)}</small></div>${c.url ? `<a class="button ghost small" href="${esc(c.url)}" target="_blank" rel="noopener">Ver certificado</a>` : `<span class="evidence-pending">Evidencia por cargar</span>`}</div>`).join('')}</div>
    </details>`).join('');

  $('languagesList').innerHTML = data.languages.map(x => `<div class="simple-item"><div><strong>${esc(x.language)}</strong><p>${esc(x.level)}</p></div>${x.certificate ? `<a class="text-link" href="${esc(x.certificate)}" target="_blank" rel="noopener">Certificado ↗</a>` : ''}</div>`).join('');
  $('referencesList').innerHTML = data.references.map(x => `<div class="simple-item"><div><strong>${esc(x.name)}</strong><p>${esc(x.role)}</p><small>${esc(x.phone)}${x.email ? ' · '+esc(x.email):''}</small></div></div>`).join('');

  $('menuBtn').addEventListener('click', () => $('mainNav').classList.toggle('open'));
  document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => $('mainNav').classList.remove('open')));
})();
