/* =====================================================================
   ANWAR CEMENT — page.js  (shared behaviour for sub-pages)
   Header, theme, language, smooth scroll, reveals, footer, toast.
   ===================================================================== */
(() => {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const CFG = Object.assign({ WHATSAPP: "8809612345678", HOTLINE: "+8809612345678", FORM_ENDPOINT: "", GA4_ID: "" }, window.AC_CONFIG || {});
  document.documentElement.classList.add("is-ready");

  /* product bag photos per theme */
  const bagSrc = src => document.documentElement.dataset.theme === "dark" ? src.replace("-white.webp", ".webp") : src.replace(/(-white)?\.webp$/, "-white.webp");
  const applyBagImages = () => $$('img[src*="/products/"]').forEach(i => { if (i.closest("[data-bag-static]")) return; const want = bagSrc(i.getAttribute("src")); if (i.getAttribute("src") !== want) i.setAttribute("src", want); });
  applyBagImages();
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => { const seen = new Set(); $$('img[src*="/products/"]').forEach(i => { const src = i.getAttribute("src"); const alt = src.includes("-white.webp") ? src.replace("-white.webp", ".webp") : src.replace(".webp", "-white.webp"); if (!seen.has(alt)) { seen.add(alt); new Image().src = alt; } }); });

  /* smooth scroll */
  const lenis = (!reduceMotion && window.Lenis) ? new Lenis({ lerp: .11, smoothWheel: true }) : null;
  if (lenis) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  const scrollToEl = (target, offset = -84) => {
    const elT = typeof target === "string" ? document.querySelector(target) : target; if (!elT) return;
    if (lenis) lenis.scrollTo(elT, { offset, duration: 1.2 }); else scrollTo({ top: elT.getBoundingClientRect().top + scrollY + offset, behavior: "smooth" });
  };
  const lockScroll = on => { document.body.style.overflow = on ? "hidden" : ""; if (lenis) on ? lenis.stop() : lenis.start(); };
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.soon !== undefined || a.getAttribute("href") === "#") return;
    const target = document.querySelector(a.getAttribute("href")); if (!target) return;
    e.preventDefault(); history.replaceState(null, "", a.getAttribute("href")); setTimeout(() => scrollToEl(target), 30);
  });

  /* contact numbers from config */
  $$('a[href*="wa.me/"]').forEach(a => (a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + CFG.WHATSAPP)));
  $$('a[href^="tel:"]').forEach(a => (a.href = "tel:" + CFG.HOTLINE));

  /* toast */
  const toast = msg => { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("is-on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("is-on"), 2200); };
  $$("a[data-soon]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); toast("Coming soon"); }));

  /* header */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const burger = $("#burger"), menu = $("#navMenu");
  burger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open); burger.classList.toggle("is-open", open); burger.setAttribute("aria-expanded", open); lockScroll(open);
  });
  $$(".has-drop > .nav__link").forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault();
    if (finePointer && innerWidth > 960) return;
    const li = btn.parentElement, open = !li.classList.contains("is-open");
    $$(".has-drop.is-open").forEach(o => { if (o !== li) { o.classList.remove("is-open"); o.firstElementChild.setAttribute("aria-expanded", "false"); } });
    li.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open);
  }));
  document.addEventListener("click", e => { if (!e.target.closest(".has-drop")) $$(".has-drop.is-open").forEach(o => { o.classList.remove("is-open"); o.firstElementChild.setAttribute("aria-expanded", "false"); }); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { $$(".has-drop.is-open").forEach(o => o.classList.remove("is-open")); if (menu.classList.contains("is-open")) burger.click(); } });
  // mark the current page in the dropdown
  const here = location.pathname.split("/").pop() || "index.html";
  $$(".nav__link[href]").forEach(a => { if ((a.getAttribute("href") || "").split("/").pop().split("#")[0] === here) a.classList.add("is-active"); });
  $$(".drop__item, .pcard").forEach(a => { if ((a.getAttribute("href") || "").split("/").pop() === here) { a.classList.add("is-current"); const spy = a.closest(".has-drop")?.querySelector(".nav__link"); spy && spy.classList.add("is-active"); } });

  /* dropdowns: cascade index for the entrance + a highlight that glides between items */
  $$(".drop__grid, .drop--products").forEach(grid => [...grid.children].forEach((it, i) => it.style.setProperty("--i", i)));
  if (finePointer) $$(".drop__grid").forEach(grid => {
    const hl = document.createElement("i"); hl.className = "drop__hl"; hl.setAttribute("aria-hidden", "true"); grid.prepend(hl);
    const move = it => { hl.style.transform = `translate(${it.offsetLeft}px,${it.offsetTop}px)`; hl.style.width = it.offsetWidth + "px"; hl.style.height = it.offsetHeight + "px"; };
    $$(".drop__item", grid).forEach(it => it.addEventListener("mouseenter", () => { if (!grid.classList.contains("has-hl")) { hl.style.transition = "none"; move(it); hl.offsetWidth; hl.style.transition = ""; } move(it); grid.classList.add("has-hl"); }));
    grid.addEventListener("mouseleave", () => grid.classList.remove("has-hl"));
  });

  /* cursor + magnetic */
  if (finePointer && !reduceMotion) {
    const cursor = $("#cursor"), label = $(".cursor__label");
    const xTo = gsap.quickTo(cursor, "x", { duration: .18, ease: "power3" }), yTo = gsap.quickTo(cursor, "y", { duration: .18, ease: "power3" });
    addEventListener("mousemove", e => { xTo(e.clientX); yTo(e.clientY); });
    $$("a, button, [data-cursor]").forEach(el => {
      el.addEventListener("mouseenter", () => { if (el.dataset.cursor) { label.textContent = el.dataset.cursor; cursor.classList.add("is-label"); } else cursor.classList.add("is-hover"); });
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover", "is-label"));
    });
    $$(".btn--magnetic").forEach(btn => {
      btn.addEventListener("mousemove", e => { const r = btn.getBoundingClientRect(); gsap.to(btn, { x: (e.clientX - (r.left + r.width / 2)) * .35, y: (e.clientY - (r.top + r.height / 2)) * .35, duration: .4, ease: "power3.out" }); });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.4)" }));
    });
  }

  /* intro + reveals */
  gsap.set(".phero__title", { opacity: 1 });   // its words rise in from motion.js
  gsap.fromTo(".phero .crumbs, .phero .eyebrow, .phero__lead, .phero__chips, .phero__cta, .phero__stats, .phero__bag", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: "expo.out", clearProps: "transform" });
  gsap.fromTo(".phero__bg", { scale: 1.12 }, { scale: 1.04, duration: 1.8, ease: "expo.out" });
  if (!reduceMotion) gsap.to(".phero__bg", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".phero", start: "top top", end: "bottom top", scrub: true } });
  $$("[data-reveal]").forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", onComplete: () => { el.classList.add("is-in"); gsap.set(el, { clearProps: "all" }); }, scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  $$("[data-stagger]").forEach(wrap => gsap.from(wrap.children, { opacity: 0, y: 24, duration: .9, stagger: .07, ease: "expo.out", clearProps: "all", scrollTrigger: { trigger: wrap, start: "top 85%", once: true } }));
  $$("[data-count]").forEach(el => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => {
    const to = parseFloat(el.dataset.count), dec = String(el.dataset.count).includes(".") ? 1 : 0, o = { v: 0 };
    if (!dec && window.AC_odometer) return window.AC_odometer(el, to);
    gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = o.v.toLocaleString("en-US", { maximumFractionDigits: dec, minimumFractionDigits: dec })) });
  } }));
  // timeline (milestones)
  if ($(".tl__line")) gsap.to(".tl__line", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".tl", start: "top 60%", end: "bottom 60%", scrub: .6 } });
  $$(".tli").forEach(t => ScrollTrigger.create({ trigger: t, start: "top 65%", end: "bottom 30%", onEnter: () => t.classList.add("is-active"), onEnterBack: () => t.classList.add("is-active"), onLeaveBack: () => t.classList.remove("is-active") }));

  /* footer */
  $("#year").textContent = new Date().getFullYear();
  $("#toTop").addEventListener("click", () => lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: "smooth" }));
  const postForm = async payload => { if (!CFG.FORM_ENDPOINT) return true; try { const r = await fetch(CFG.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...payload, page: location.href, at: new Date().toISOString() }) }); return r.ok; } catch { return false; } };
  $("#nl").addEventListener("submit", async e => { e.preventDefault(); const ok = await postForm({ type: "newsletter", email: e.target.querySelector("input").value.trim() }); toast(ok ? "Subscribed. Welcome aboard." : "Couldn't subscribe right now. Please try again."); if (ok) e.target.reset(); });
  setTimeout(() => $("#fab").classList.add("is-on"), 800);

  /* language */
  const I18N = window.AC_I18N || {};
  const setLang = lang => { document.documentElement.lang = lang; const i = lang === "bn" ? 1 : 0; $$("[data-i18n]").forEach(elm => { const t = I18N[elm.dataset.i18n]; if (t) elm.innerHTML = t[i]; }); try { localStorage.setItem("ac_lang", lang); } catch {} };
  $$("[data-lang-toggle]").forEach(b => b.addEventListener("click", () => { const next = document.documentElement.lang === "bn" ? "en" : "bn"; gsap.to("main, .header, footer", { opacity: .4, duration: .15, onComplete: () => { setLang(next); gsap.to("main, .header, footer", { opacity: 1, duration: .4 }); } }); }));
  try { if (localStorage.getItem("ac_lang") === "bn") setLang("bn"); } catch {}

  /* lightbox (media pages) */
  const lb = $("#lb");
  if (lb) {
    const lbBox = $("#lbBox");
    const openLb = html => { lbBox.innerHTML = html; lb.hidden = false; lockScroll(true); gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: .3 }); gsap.fromTo(lbBox, { scale: .94, y: 12 }, { scale: 1, y: 0, duration: .6, ease: "expo.out" }); };
    const closeLb = () => { gsap.to(lb, { opacity: 0, duration: .25, onComplete: () => { lb.hidden = true; lbBox.innerHTML = ""; lockScroll(false); } }); };
    $$("[data-video]").forEach(b => b.addEventListener("click", () => openLb(`<video src="${b.dataset.video}" controls autoplay playsinline></video>`)));
    $$("[data-img]").forEach(b => b.addEventListener("click", () => openLb(`<img src="${b.dataset.img}" alt="">`)));
    $("#lbClose").addEventListener("click", closeLb);
    lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  }
  /* filter chips (news / gallery / downloads) */
  $$("[data-filter-group]").forEach(group => {
    const items = $$(group.dataset.filterGroup);
    $$("button", group).forEach(b => b.addEventListener("click", () => {
      $$("button", group).forEach(x => x.classList.toggle("is-active", x === b));
      const f = b.dataset.filter;
      items.forEach(it => { it.hidden = f !== "all" && it.dataset.cat !== f; });
      gsap.from(items.filter(it => !it.hidden), { opacity: 0, y: 14, stagger: .04, duration: .5, ease: "power2.out", clearProps: "all" });
      ScrollTrigger.refresh();
    }));
  });

  /* calculator (calculator.html) */
  if ($("#calculator") && window.AC_initCalculator) window.AC_initCalculator({ $, $$, toast, bagSrc });

  /* theme */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const setTheme = (t, animate = true) => {
    const root = document.documentElement;
    if (animate) { root.classList.add("is-theming"); setTimeout(() => root.classList.remove("is-theming"), 450); }
    root.dataset.theme = t; try { localStorage.setItem("ac_theme", t); } catch {}
    if (themeMeta) themeMeta.content = t === "dark" ? "#0E0F11" : "#DD2930";
    $$("[data-theme-toggle]").forEach(b => { b.setAttribute("aria-pressed", t === "dark"); b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"); });
    applyBagImages();
  };
  $$("[data-theme-toggle]").forEach(b => b.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark", go = animate => setTheme(next, animate);
    window.AC_themeSwap ? window.AC_themeSwap(b, go) : go(true);   // circular reveal lives in motion.js
  }));
  { const cur = document.documentElement.dataset.theme || "light"; let chosen = null; try { chosen = localStorage.getItem("ac_theme"); } catch {} setTheme(cur, false); if (!chosen) { try { localStorage.removeItem("ac_theme"); } catch {} } }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => { try { if (!localStorage.getItem("ac_theme")) setTheme(e.matches ? "dark" : "light"); } catch {} });
})();
