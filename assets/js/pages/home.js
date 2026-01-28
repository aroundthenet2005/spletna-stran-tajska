import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns, qs, escapeHTML, toast } from "../app.js";

function stars(n=5){
  const full = "★".repeat(Math.max(0, Math.min(5, n)));
  const empty = "☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, n))));
  return full + empty;
}

function comfortCard(icon, key, val){
  return `
    <div class="comfort">
      <div class="ico">${icon}</div>
      <div class="txt">
        <div class="k">${escapeHTML(key)}</div>
        <div class="v">${escapeHTML(val)}</div>
      </div>
    </div>
  `;
}

async function main(){
  applyTheme(await getJSON("content/settings/theme.json"));
  await mountNav("index.html");

  const g = await getJSON("content/settings/global.json");
  const page = await getJSON("content/pages/home.json");
  const idx = await getJSON("content/apartments/index.json");
  const aps = await Promise.all((idx.list||[]).map(id=> getJSON(`content/apartments/${id}.json`)));

  // Primary apartment for landing
  const primaryId = (g.primaryApartmentId || "apartma1");
  const ap = aps.find(x => x.id === primaryId) || aps[0];

  // Hero
  qs("#kicker").textContent = page.hero?.kicker || "";
  qs("#heroTitle").textContent = page.hero?.title || "";
  qs("#heroSub").textContent = page.hero?.subtitle || "";

  const v = qs("#heroVideo");
  const img = qs("#heroPoster");
  const videoUrl = page.hero?.video || "";
  const posterUrl = page.hero?.poster || "assets/media/images/hero.jpg";

  if(img) img.src = posterUrl;

  if(v){
    if(videoUrl){
      v.src = videoUrl;
      v.addEventListener("loadeddata", ()=>{ if(img) img.style.opacity = "0"; });
      v.addEventListener("error", ()=>{ if(img) img.style.opacity = "1"; });
      v.play().catch(()=>{ /* ignore */ });
    }else{
      v.removeAttribute("src");
      try{ v.load(); }catch(e){}
    }
  }

  // Hero CTA
  const bookingUrl = ap.bookingUrl || g.bookingUrl || "#";
  const tourUrl = g.tourEmbedUrl || ap.tourEmbedUrl || "";

  const bookBtn = qs("#heroBookBtn");
  if(bookBtn){
    bookBtn.href = bookingUrl;
    bookBtn.textContent = "CHECK AVAILABILITY";
    bookBtn.addEventListener("click", ()=> toast("Opening booking…"));
  }

  // Hero tour button: scroll to tour section (tour embed is already visible on-page)
  const tourBtn = qs("#heroTourBtn");
  if(tourBtn){
    tourBtn.textContent = "3D TOUR";
    tourBtn.href = "#tour";
  }

  // Booking head text
  qs("#listingTitle").textContent = ap.landingTitle || ap.name || "Apartment";
  qs("#listingSub").textContent = ap.landingSubtitle || ap.teaser || "";
  qs("#ratingLine").textContent = ap.ratingLine || "★★★★★ • Self check‑in • Fast Wi‑Fi";

  qs("#checkAvailTop").href = bookingUrl;
  qs("#seeDatesBtn").href = bookingUrl;
  qs("#requestToBookBtn").href = bookingUrl;

  // Comforts (more readable, fits boxes)
  const facts = ap.facts || {};
  const comforts = [
    ["👤","Sleeps", facts.sleeps || `${ap.maxGuests || 4} guests`],
    ["🛏️","Beds", facts.bedrooms || ap.beds || "2 beds"],
    ["🚿","Bathrooms", facts.bathrooms || "1 bathroom"],
    ["📶","Wi‑Fi", facts.wifi || "Fast Wi‑Fi"]
  ];
  qs("#comfortGrid").innerHTML = comforts.map(([ic,k,v]) => comfortCard(ic,k,v)).join("");

  // 3D tour embed (VISIBLE by default, large)
  const homeTour = qs("#homeTour");
  const openTourBtn = qs("#openTourBtn");
  if(openTourBtn){
    openTourBtn.href = tourUrl || "#";
    openTourBtn.style.pointerEvents = tourUrl ? "auto" : "none";
    if(!tourUrl) openTourBtn.textContent = "Add 3D tour URL";
  }

  homeTour.innerHTML = tourUrl
    ? `<iframe class="iframe-16x9" src="${tourUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`
    : `<div class="small">Add the embed link in <code>content/settings/global.json</code> → <code>tourEmbedUrl</code></div>`;

  // Gallery thumbnails (smaller + more + "See more")
  const gallery = (ap.gallery || []).slice(0, 8);
  const moreHref = `apartment.html?id=${encodeURIComponent(ap.id)}`;
  const moreBtn = qs("#seeMoreGalleryBtn");
  if(moreBtn) moreBtn.href = moreHref;

  qs("#homeGallery").innerHTML = gallery.map((src,i)=>`
    <a href="${moreHref}" aria-label="Open gallery">
      <img src="${src}" alt="Gallery ${i+1}">
    </a>
  `).join("") || `<div class="small">Add images to <code>content/apartments/${escapeHTML(ap.id)}.json</code> → <code>gallery</code></div>`;

  // Why love checklist
  const why = (ap.whyLove || []);
  qs("#whyLove").innerHTML = why.map(x=> `
    <li><span class="tick">✓</span><span>${escapeHTML(x)}</span></li>
  `).join("");

  // Map embed
  const mapUrl = ap.neighborhood?.mapEmbedUrl || "";
  const mapEl = qs("#mapEmbed");
  if(mapUrl){
    mapEl.innerHTML = `<iframe class="map-embed" src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  }else{
    mapEl.innerHTML = `<div class="small" style="opacity:.85">${escapeHTML(ap.neighborhood?.note || "Add a map embed URL.")}</div>`;
  }

  // Testimonial (fits booking-shell)
  const t = ap.testimonial || {};
  qs("#testimonial").innerHTML = `
    <div class="quote">“${escapeHTML(t.quote || "Add a guest quote in apartma1.json")}”</div>
    <div class="small" style="margin-top:10px">— ${escapeHTML(t.author || "Guest review")}</div>
    <div class="stars" aria-label="Rating" style="margin-top:10px">${escapeHTML(stars(Number(t.stars||5)))}</div>
  `;

  // Apartments section
  qs("#apTitle").textContent = page.sections?.apartmentsTitle || "More apartments";
  qs("#apSub").textContent = page.sections?.apartmentsSubtitle || "";
  qs("#apartmentsGrid").innerHTML = aps.map(x=>`
    <a class="card ap-card fade" href="apartment.html?id=${encodeURIComponent(x.id)}">
      <div class="img"><img src="${x.gallery?.[0] || "assets/media/images/01.jpg"}" alt="${escapeHTML(x.name||"Apartment")}"></div>
      <div class="pad">
        <div class="h3">${escapeHTML(x.name||"Apartment")}</div>
        <div class="sub">${escapeHTML(x.teaser||"")}</div>
        <div class="pills" style="margin-top:10px">
          ${x.size? `<span class="pill">${escapeHTML(x.size)}</span>`:""}
          ${x.maxGuests? `<span class="pill">${escapeHTML(String(x.maxGuests))} guests</span>`:""}
          ${x.beds? `<span class="pill">${escapeHTML(x.beds)}</span>`:""}
        </div>
      </div>
    </a>
  `).join("");

  await mountFooter(); mountFadeIns();
}

main();
