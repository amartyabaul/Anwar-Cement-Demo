/* =====================================================================
   ANWAR CEMENT — calculator.js  (Smart Cement Calculator)
   Shared by index.html (#calculator section) and calculator.html.
   Call window.AC_initCalculator({ $, $$, toast, bagSrc }) once the DOM is ready.
   ===================================================================== */
window.AC_initCalculator = function ({ $, $$, toast, bagSrc }) {
  /* -------------------------------------------------------------------
     16. SMART CEMENT CALCULATOR
     ------------------------------------------------------------------- */
  const FT = 0.3048, M3_TO_CFT = 35.3147, BAG_M3 = 0.0347, BAG_KG = 50;
  const BRICK_WITH_MORTAR = 0.254 * 0.127 * 0.0762;   // 10" x 5" x 3" nominal (m³)
  const BRICK_NET = 0.2413 * 0.1143 * 0.0699;         // 9.5" x 4.5" x 2.75" (m³)
  const JOB_META = {
    slab:    { name: "RCC slab",       brand: 0, why: "High strength for structural concrete" },
    column:  { name: "Column / beam",  brand: 0, why: "Early strength for formwork cycles" },
    plaster: { name: "Plaster",        brand: 2, why: "Smooth, workable finish for plaster" },
    brick:   { name: "Brickwork",      brand: 2, why: "Reliable mortar strength at a fair price" },
    floor:   { name: "PCC flooring",   brand: 1, why: "Durable, crack-resistant floors" },
  };
  const BRAND_META2 = [
    { name: "Anwar Cement Special", img: "assets/img/products/anwar-special.webp", mini: "assets/img/bag-mini/anwar-special.webp" },
    { name: "Shoktiman Cement",     img: "assets/img/products/shoktiman.webp",     mini: "assets/img/bag-mini/shoktiman.webp" },
    { name: "Lion Cement",          img: "assets/img/products/lion.webp",          mini: "assets/img/bag-mini/lion.webp" },
  ];
  const cq = id => $("#" + id);
  // accept Bangla (০-৯) and Arabic-Indic digits and a comma decimal; keep only one decimal point
  const toAscii = s => String(s)
    .replace(/[০-৯]/g, d => d.charCodeAt(0) - 0x09E6)
    .replace(/[٠-٩۰-۹]/g, d => (d.charCodeAt(0) - 0x0660) % 0x90)
    .replace(/,/g, ".").replace(/[^\d.]/g, "").replace(/(\..*?)\./g, "$1");
  const num = id => Math.max(0, parseFloat(toAscii(cq(id).value)) || 0);
  let job = "slab", cunit = "ft", last = null;

  const fmt = (n, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const toM = v => cunit === "ft" ? v * FT : v;

  const showFields = () => {
    $$("#fields .field").forEach(f => (f.hidden = !f.dataset.for.split(" ").includes(job)));
    const u = cunit === "ft" ? "ft" : "m";
    ["lblL:Length", "lblW:Width", "lblH:Height", "lblB:Breadth"].forEach(x => { const [id, t] = x.split(":"); cq(id).innerHTML = `${t} <em>(${u})</em>`; });
    $$("#fields .field").forEach(f => { const sp = f.querySelector("span"); if (sp.textContent.startsWith("Depth")) sp.innerHTML = `Depth <em>(${u})</em>`; });
  };

  const compute = () => {
    const waste = 1 + num("inWaste") / 100;
    let wet = 0, dry = 0, cementM3 = 0, sandM3 = 0, aggM3 = 0, bricks = 0, how = "";
    if (job === "slab" || job === "floor" || job === "column") {
      const [a, b, c] = cq("inMix").value.split(":").map(Number), S = a + b + c;
      if (job === "column") wet = toM(num("inB")) * toM(num("inD")) * toM(num("inH")) * Math.max(1, num("inN"));
      else wet = toM(num("inL")) * toM(num("inW")) * (num("inT") * 0.0254);
      dry = wet * 1.54 * waste;
      cementM3 = dry * a / S; sandM3 = dry * b / S; aggM3 = dry * c / S;
      how = `Wet volume = ${job === "column" ? "breadth × depth × height × columns" : "length × width × thickness"} = <code>${fmt(wet, 3)} m³</code>. Dry volume = wet × 1.54 (+${num("inWaste")}% wastage) = <code>${fmt(dry, 3)} m³</code>. Mix ${cq("inMix").value} → cement = dry × ${a}/${S}, sand = dry × ${b}/${S}, stone chips = dry × ${c}/${S}. One 50 kg bag ≈ 0.0347 m³.`;
    } else if (job === "plaster") {
      const x = Number(cq("inMortar").value), area = toM(num("inL")) * toM(num("inH"));
      wet = area * (Number(cq("inPT").value) / 1000);
      dry = wet * 1.27 * waste;
      cementM3 = dry / (1 + x); sandM3 = dry * x / (1 + x);
      how = `Plaster area = length × height = <code>${fmt(area, 2)} m²</code> × ${cq("inPT").value} mm = wet volume <code>${fmt(wet, 3)} m³</code>. Dry volume = wet × 1.27 (+${num("inWaste")}% wastage) = <code>${fmt(dry, 3)} m³</code>. Mortar 1:${x} → cement = dry ÷ ${1 + x}, sand = dry × ${x}/${1 + x}.`;
    } else if (job === "brick") {
      const x = Number(cq("inMortar").value), t = Number(cq("inWT").value) * 0.0254;
      const vol = toM(num("inL")) * toM(num("inH")) * t;
      bricks = Math.ceil(vol / BRICK_WITH_MORTAR * waste);
      wet = vol - (vol / BRICK_WITH_MORTAR) * BRICK_NET;
      dry = wet * 1.33 * waste;
      cementM3 = dry / (1 + x); sandM3 = dry * x / (1 + x);
      how = `Wall volume = length × height × ${cq("inWT").value}" = <code>${fmt(vol, 3)} m³</code>. Bricks = volume ÷ 0.00246 m³ (10"×5"×3" with mortar) = <code>${fmt(bricks)}</code>. Mortar wet volume = wall − bricks × 0.00193 m³ = <code>${fmt(wet, 3)} m³</code>, dry = wet × 1.33 (+${num("inWaste")}%). Mortar 1:${x} → cement = dry ÷ ${1 + x}.`;
    }
    const bagsExact = cementM3 / BAG_M3, bags = Math.ceil(bagsExact);
    const cementKg = bagsExact * BAG_KG, sandCft = sandM3 * M3_TO_CFT, aggCft = aggM3 * M3_TO_CFT;
    const water = cementKg * 0.45;
    const cost = bags * num("pCement") + sandCft * num("pSand") + aggCft * num("pAgg") + bricks * num("pBrick");
    return { wet, bags, bagsExact, cementKg, sandCft, aggCft, bricks, water, cost, how };
  };

  const tweenNum = (el, to, d = 0) => { const o = { v: parseFloat(el.textContent.replace(/,/g, "")) || 0 }; gsap.to(o, { v: to, duration: .8, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.v, d)) }); };

  const render = () => {
    const r = compute(); last = r;
    window.AC_odometer ? window.AC_odometer(cq("rBags"), r.bags, { duration: .9 }) : tweenNum(cq("rBags"), r.bags); tweenNum(cq("rCementKg"), r.cementKg); tweenNum(cq("rSand"), r.sandCft, 1);
    tweenNum(cq("rAgg"), r.aggCft, 1); tweenNum(cq("rBrick"), r.bricks); tweenNum(cq("rWater"), r.water); tweenNum(cq("rCost"), r.cost);
    cq("rVol").textContent = fmt(r.wet, 2) + " m³";
    cq("rVolLabel").textContent = job === "brick" ? "Mortar volume" : job === "plaster" ? "Plaster volume" : "Wet volume";
    $("[data-m=agg]").hidden = r.aggCft === 0; $("[data-m=brick]").hidden = r.bricks === 0;
    const maxCft = Math.max(r.cementKg / 45, r.sandCft, r.aggCft, r.bricks / 40, r.water / 30, 1);
    const bars = { cement: r.cementKg / 45, sand: r.sandCft, agg: r.aggCft, brick: r.bricks / 40, water: r.water / 30 };
    for (const k in bars) gsap.to(`[data-m=${k}] .mats__bar i`, { width: (bars[k] / maxCft * 100) + "%", duration: .8, ease: "expo.out" });
    const jm = JOB_META[job], bm = BRAND_META2[jm.brand];
    // bag glyph row: the recommended brand's real bag (1 glyph = 5 bags, capped)
    const row = cq("bagRow"); row.innerHTML = "";
    const glyphs = Math.min(60, Math.ceil(r.bags / 5));
    for (let i = 0; i < glyphs; i++) { const b = document.createElement("img"); b.src = bm.mini; b.alt = ""; b.decoding = "async"; if (i === glyphs - 1 && r.bags % 5 && r.bags % 5 <= 2) b.className = "is-half"; row.appendChild(b); }
    gsap.from(row.children, { opacity: 0, y: -22, scaleY: .7, transformOrigin: "50% 100%", stagger: { amount: .55 }, duration: .6, ease: "back.out(2.4)" });   // bags drop onto the stack
    // brand
    cq("rBrandImg").src = bagSrc(bm.img); cq("rBrandName").textContent = bm.name; cq("rBrandWhy").textContent = jm.why;
    cq("howText").innerHTML = r.how;
    // WhatsApp
    cq("waBtn").href = "https://wa.me/?text=" + encodeURIComponent(summary());
  };

  const summary = () => {
    const r = last, jm = JOB_META[job];
    const dims = job === "column" ? `${num("inB")}×${num("inD")}×${num("inH")} ${cunit} × ${num("inN")}` : job === "slab" || job === "floor" ? `${num("inL")}×${num("inW")} ${cunit}, ${num("inT")}" thick` : `${num("inL")}×${num("inH")} ${cunit}`;
    let t = `Anwar Cement estimate — ${jm.name} (${dims})\n• Cement: ${r.bags} bags (50 kg)\n• Sand: ${fmt(r.sandCft, 1)} cft`;
    if (r.aggCft) t += `\n• Stone chips: ${fmt(r.aggCft, 1)} cft`;
    if (r.bricks) t += `\n• Bricks: ${fmt(r.bricks)} pcs`;
    t += `\n• Water: ~${fmt(r.water)} L\n• Est. cost: ৳${fmt(r.cost)}\nRecommended: ${BRAND_META2[jm.brand].name}\nanwarcement.com/#calculator`;
    return t;
  };

  $$("#jobs .job").forEach(b => b.addEventListener("click", () => {
    $$("#jobs .job").forEach(x => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", x === b); });
    job = b.dataset.job; showFields(); render();
  }));
  $$("#unitSeg .seg__btn").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.cunit === cunit) return;
    $$("#unitSeg .seg__btn").forEach(x => x.classList.toggle("is-active", x === b));
    $("#unitSeg").classList.toggle("is-right", b.dataset.cunit === "m");
    // convert current values so the estimate doesn't jump
    const f = b.dataset.cunit === "m" ? FT : 1 / FT;
    ["inL", "inW", "inH", "inB", "inD"].forEach(id => (cq(id).value = +(num(id) * f).toFixed(2)));
    cunit = b.dataset.cunit; showFields(); render();
  }));
  // number boxes are type="text" (a number input rejects Bangla digits); clean what is typed as it is typed
  $$("#calculator input[inputmode]").forEach(i => i.addEventListener("input", () => {
    const clean = toAscii(i.value);
    if (clean !== i.value) { const pos = Math.max(0, (i.selectionStart || 0) - (i.value.length - clean.length)); i.value = clean; try { i.setSelectionRange(pos, pos); } catch {} }
  }));
  $$("#calculator input, #calculator select").forEach(i => i.addEventListener("input", render));
  $$("[data-preset]").forEach(b => b.addEventListener("click", () => {
    const p = JSON.parse(b.dataset.preset);
    if (cunit === "m") $$("#unitSeg .seg__btn")[0].click();
    $(`#jobs .job[data-job="${p.job}"]`).click();
    for (const k in p) if (k !== "job") cq(k).value = p[k];
    render();
    gsap.fromTo("#calcResult", { opacity: .6 }, { opacity: 1, duration: .5 });
  }));
  cq("copyBtn").addEventListener("click", async () => { try { await navigator.clipboard.writeText(summary()); toast("Estimate copied"); } catch { toast("Copy not available"); } });
  cq("pdfBtn").addEventListener("click", () => {
    const w = open("", "_blank", "width=720,height=900"); if (!w) return toast("Allow pop-ups to save PDF");
    const r = last, jm = JOB_META[job];
    w.document.write(`<!doctype html><title>Anwar Cement estimate</title><style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px;color:#0E0F11}h1{color:#DD2930;font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:24px 0 8px}table{border-collapse:collapse;width:100%}td,th{padding:10px 12px;border-bottom:1px solid #e5e5e5;text-align:left;font-size:14px}th{background:#f3f3f1;font-size:12px;letter-spacing:.06em;text-transform:uppercase}.big{font-size:44px;font-weight:800;letter-spacing:-.03em}.muted{color:#8C9097;font-size:12px}@media print{button{display:none}}</style>
      <h1>ANWAR CEMENT</h1><div class="muted">Material estimate · ${new Date().toLocaleDateString("en-GB")}</div>
      <h2>${jm.name}</h2><div class="big">${r.bags} bags</div><div class="muted">of 50 kg cement · recommended: ${BRAND_META2[jm.brand].name}</div>
      <h2>Materials</h2><table><tr><th>Item</th><th>Quantity</th></tr>
      <tr><td>Cement</td><td>${r.bags} bags (${fmt(r.cementKg)} kg)</td></tr><tr><td>Sand</td><td>${fmt(r.sandCft, 1)} cft</td></tr>
      ${r.aggCft ? `<tr><td>Stone chips</td><td>${fmt(r.aggCft, 1)} cft</td></tr>` : ""}${r.bricks ? `<tr><td>Bricks</td><td>${fmt(r.bricks)} pcs</td></tr>` : ""}
      <tr><td>Water</td><td>~${fmt(r.water)} L</td></tr><tr><td><b>Estimated cost</b></td><td><b>৳ ${fmt(r.cost)}</b></td></tr></table>
      <h2>Method</h2><div class="muted" style="font-size:13px;line-height:1.6">${r.how.replace(/<\/?code>/g, "")}</div>
      <p class="muted" style="margin-top:30px">Estimates only. Confirm with your engineer. Hotline +880 96123 45678 · anwarcement.com</p>
      <script>setTimeout(()=>print(),300)<\/script>`);
    w.document.close();
  });
  showFields(); render();
};
