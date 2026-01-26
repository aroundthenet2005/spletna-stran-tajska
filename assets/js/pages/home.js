import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML, toast } from "../app.js";
function safeVideo(url){
  const v = document.createElement("video");
  v.src = url; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
  v.setAttribute("preload","metadata"); return v;
}
async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");
  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");
  const aps = await Promise.all((idx.list||[]).map(id=> getJSON(`content/apartments/${id}.json`)));
  qs("#kicker").textContent = page.hero.kicker || "";
  qs("#heroTitle").textContent = page.hero.title || "";
  qs("#heroSub").textContent = page.hero.subtitle || "";
  const media = qs("#heroMedia"); media.innerHTML = "";
  const wrap = document.createElement("div"); wrap.className = "card hero-media";
  const videoUrl = page.hero.video; const posterUrl = page.hero.poster;
  if(videoUrl){
    const v = safeVideo(videoUrl);
    v.addEventListener("error", ()=>{ media.innerHTML = `<img src="${posterUrl}" alt="Hero">`; });
    wrap.appendChild(v);
  } else wrap.innerHTML = `<img src="${posterUrl}" alt="Hero">`;
  wrap.insertAdjacentHTML("beforeend", `<div class="overlay"></div>
    <div class="floating">
      <div style="display:flex; gap:10px; flex:1; align-items:center; flex-wrap:wrap">
        <div class="field" style="min-width:140px"><div class="label">Check-in</div><input class="input" type="date" id="inDate"></div>
        <div class="field" style="min-width:140px"><div class="label">Check-out</div><input class="input" type="date" id="outDate"></div>
        <div class="field" style="min-width:110px"><div class="label">Guests</div><input class="input" type="number" id="guests" min="1" value="2"></div>
      </div>
      <a class="btn primary" id="bookBtn" href="${g.bookingUrl}" target="_blank" rel="noopener">${escapeHTML(g.ctaLabel||"BOOK NOW")}</a>
    </div>`);
  media.appendChild(wrap);
  qs("#kpis").innerHTML = (page.highlights||[]).slice(0,3).map(h=>`
    <div class="kpi"><div class="t">${escapeHTML(h.title||"")}</div><div class="s">${escapeHTML(h.text||"")}</div></div>`).join("");
  qs("#apTitle").textContent = page.sections.apartmentsTitle || "Apartments";
  qs("#apSub").textContent = page.sections.apartmentsSubtitle || "";
  qs("#apartmentsGrid").innerHTML = aps.map(ap=>`
    <a class="card ap-card fade" href="apartment.html?id=${encodeURIComponent(ap.id)}">
      <div class="img"><img src="${ap.gallery?.[0] || "assets/media/images/placeholder-1.svg"}" alt="${escapeHTML(ap.name||"Apartment")}"></div>
      <div class="body">
        <div class="badge"><span class="dot"></span>${escapeHTML(ap.size||"")}${ap.maxGuests? " • "+escapeHTML(String(ap.maxGuests))+" guests":""}</div>
        <div class="name">${escapeHTML(ap.name||"")}</div>
        <p class="teaser">${escapeHTML(ap.teaser||"")}</p>
        <div class="pills">${(ap.highlights||[]).slice(0,4).map(x=> `<span class="pill">${escapeHTML(x)}</span>`).join("")}</div>
      </div>
    </a>`).join("");
  qs("#tourTitle").textContent = page.sections.tourTitle || "3D Tour";
  qs("#tourSub").textContent = page.sections.tourSubtitle || "";
  qs("#tourFrame").src = g.tourEmbedUrl || "";
  qs("#resTitle").textContent = page.sections.residenceTitle || "The Residence";
  qs("#resSub").textContent = page.sections.residenceSubtitle || "";
  await mountFooter(); mountFadeIns();
  const bookBtn = qs("#bookBtn"); if(bookBtn) bookBtn.addEventListener("click", ()=> toast("Opening booking…"));
}
main();