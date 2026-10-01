/* =====================================================================
   ANWAR CEMENT — main.js  (Phase 1: Header + Hero)
   ===================================================================== */
(() => {
  "use strict";
  gsap.registerPlugin(ScrollTrigger);

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer  = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const skipIntro    = new URLSearchParams(location.search).has("nointro"); // dev helper
  // product bag photos: white-background variant in light mode, dark variant in dark mode
  const bagSrc = src => document.documentElement.dataset.theme === "dark" ? src.replace("-white.webp", ".webp") : src.replace(/(-white)?\.webp$/, "-white.webp");
  const applyBagImages = () => $$('img[src*="/products/"]').forEach(i => { const want = bagSrc(i.getAttribute("src")); if (i.getAttribute("src") !== want) i.setAttribute("src", want); });
  applyBagImages();
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => { const seen = new Set(); $$('img[src*="/products/"]').forEach(i => { const src = i.getAttribute("src"); const alt = src.includes("-white.webp") ? src.replace("-white.webp", ".webp") : src.replace(".webp", "-white.webp"); if (!seen.has(alt)) { seen.add(alt); new Image().src = alt; } }); });
  const CFG = Object.assign({ WHATSAPP: "8809612345678", HOTLINE: "+8809612345678", FORM_ENDPOINT: "", GA4_ID: "" }, window.AC_CONFIG || {});

  /* -------------------------------------------------------------------
     0. SMOOTH SCROLL (Lenis) + anchor handling
     ------------------------------------------------------------------- */
  const lenis = (!reduceMotion && window.Lenis) ? new Lenis({ lerp: .11, wheelMultiplier: 1, smoothWheel: true }) : null;
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToEl = (target, offset = -84) => {
    const elTarget = typeof target === "string" ? document.querySelector(target) : target;
    if (!elTarget) return;
    if (lenis) lenis.scrollTo(elTarget, { offset, duration: 1.2 });
    else scrollTo({ top: elTarget.getBoundingClientRect().top + scrollY + offset, behavior: "smooth" });
  };
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.dataset.soon !== undefined || a.getAttribute("href") === "#") return;
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    history.replaceState(null, "", a.getAttribute("href"));
    setTimeout(() => scrollToEl(target), 30);   // let the mobile menu close first
  });
  const lockScroll = on => { document.body.style.overflow = on ? "hidden" : ""; if (lenis) on ? lenis.stop() : lenis.start(); };

  // apply configured contact numbers to static links
  $$('a[href*="wa.me/"]').forEach(a => (a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + CFG.WHATSAPP)));
  $$('a[href^="tel:"]').forEach(a => (a.href = "tel:" + CFG.HOTLINE));
  if (CFG.GA4_ID) { const g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.GA4_ID; document.head.appendChild(g); window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag("js", new Date()); gtag("config", CFG.GA4_ID); }

  /* -------------------------------------------------------------------
     1. HERO VIDEO PLAYLIST — plays every clip back to back, forever.
        Two <video> layers crossfade so there is never a black frame.
     ------------------------------------------------------------------- */
  const SMALL = matchMedia("(max-width: 900px)").matches;
  const vsrc = n => `assets/video/hero-${n}${SMALL ? "-720" : ""}.mp4`;
  const PLAYLIST = [
    { src: vsrc(1), name: "The Plant" },
    { src: vsrc(2), name: "Strength" },
    { src: vsrc(3), name: "The Brand" },
    { src: vsrc(4), name: "Landmarks" },
  ];

  const hero     = $("#hero");
  const layers   = [$("#videoA"), $("#videoB")];

  let front = 0;          // index into layers
  let current = -1;       // index into PLAYLIST
  let preloadTimer = null, playToken = 0;
  let firstFrameReady = null;

  const loadInto = (video, i) => new Promise(resolve => {
    const clip = PLAYLIST[i];
    if (video.dataset.src === clip.src) return resolve();
    video.dataset.src = clip.src;
    video.preload = "auto";
    video.src = clip.src;
    video.load();
    const done = () => { video.removeEventListener("canplay", done); resolve(); };
    video.addEventListener("canplay", done);
    setTimeout(resolve, 4000); // never block forever
  });

  const updateRail = () => {};
  const tick = () => {};
  async function play(i, useFront = false) {
    current = i;
    const token = ++playToken;
    clearTimeout(preloadTimer);
    // Normally the hidden layer takes the next clip; on first start the front layer already holds clip 0.
    const nextLayer = useFront ? layers[front] : layers[1 - front];
    const prevLayer = useFront ? layers[1 - front] : layers[front];

    await loadInto(nextLayer, i);
    if (token !== playToken) return;   // a newer request superseded this one
    nextLayer.currentTime = 0;
    nextLayer.muted = true;   // hero video is always silent
    const started = new Promise(res => { const done = () => { nextLayer.removeEventListener("playing", done); res(); }; nextLayer.addEventListener("playing", done); setTimeout(res, 1500); });
    nextLayer.play().catch(() => { /* autoplay blocked: poster stays */ });
    await started;
    if (token !== playToken) return;

    nextLayer.classList.add("is-front");
    prevLayer.classList.remove("is-front");
    front = layers.indexOf(nextLayer);
    updateRail();

    // Pre-buffer the following clip in the now-hidden layer
    const nxt = (i + 1) % PLAYLIST.length;
    preloadTimer = setTimeout(() => { if (prevLayer !== layers[front]) { prevLayer.pause(); loadInto(prevLayer, nxt); } }, 1200);

  }

  layers.forEach(v => {
    v.addEventListener("ended", () => {
      if (v === layers[front]) play((current + 1) % PLAYLIST.length);
    });
    // safety net for clips that never fire "ended"
    v.addEventListener("timeupdate", () => {
      if (v === layers[front] && v.duration && v.duration - v.currentTime < 0.08 && !v.paused) {
        v.pause();
        play((current + 1) % PLAYLIST.length);
      }
    });
  });

  // Pause the playlist when the tab is hidden (saves battery, keeps sync)
  document.addEventListener("visibilitychange", () => {
    const v = layers[front];
    if (document.hidden) v.pause(); else v.play().catch(() => {});
  });

  // Kick off: load clip 0 into layer A, then start.
  firstFrameReady = loadInto(layers[0], 0);

  /* -------------------------------------------------------------------
     2. HEADLINE — split into words for a staggered mask reveal
     ------------------------------------------------------------------- */
  $$("#heroTitle .line").forEach(line => {
    line.innerHTML = line.innerHTML.trim().split(/\s+/).map(w =>
      /^<em>/.test(w) || /<\/em>$/.test(w) ? `<span class="word">${w}</span>` : `<span class="word">${w}</span>`
    ).join(" ");
  });

  /* -------------------------------------------------------------------
     3. PRELOADER + INTRO TIMELINE
     ------------------------------------------------------------------- */
  document.body.classList.add("is-loading");
  const loader = $("#loader");
  const bar = $("#loaderBar");

  const loaderTl = gsap.timeline();
  loaderTl
    .to(".loader__logo", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, 0)
    .to(bar, { width: "70%", duration: 1.1, ease: "power2.inOut" }, .1)
    .to(".loader__tag", { opacity: 1, duration: .6 }, .5);

  const intro = () => {
    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      onStart: () => { hero.classList.add("is-ready"); document.documentElement.classList.add("is-ready"); },
      onComplete: () => document.body.classList.remove("is-loading"),
    });
    tl.to(bar, { width: "100%", duration: .35, ease: "power2.in" })
      .to(".loader__inner", { opacity: 0, y: -14, duration: .4 }, "-=.05")
      .to(loader, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=.15")
      .set(loader, { display: "none" })
      // header pieces
      .from(".header", { y: -20, opacity: 0, duration: .8, clearProps: "all" }, "-=.7")
      .from(".nav__item, .nav__right", { y: -10, opacity: 0, stagger: .05, duration: .6, clearProps: "all" }, "-=.6")
      // media zoom-settle
      .fromTo("#heroMedia", { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "expo.out" }, "-=.9")
      // words
      .to("#heroTitle .word", { y: 0, duration: 1.1, stagger: .06 }, "-=1.6")
      .to(".hero__eyebrow", { opacity: 1, y: 0, duration: .8 }, "-=1.1")
      .to(".hero__lead, .hero__cta", { opacity: 1, y: 0, duration: .9, stagger: .12 }, "-=.9")
      .to(".stats, .scroll-cue", { opacity: 1, y: 0, duration: .9, stagger: .1, onStart: countUp }, "-=.7");
    if (reduceMotion || skipIntro) tl.progress(1);
  };

  // Start when fonts + first video frame are ready (with a hard cap)
  Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), firstFrameReady]),
    new Promise(r => setTimeout(r, skipIntro ? 0 : 3500)),
  ]).then(() => {
    play(0, true);
    intro();
  });

  /* -------------------------------------------------------------------
     4. COUNTERS
     ------------------------------------------------------------------- */
  function countUp() {
    $$(".count").forEach(el => {
      const to = +el.dataset.to;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: to, duration: 1.8, ease: "power3.out",
        onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("en-US")),
      });
    });
  }

  /* -------------------------------------------------------------------
     5. HEADER — compact on scroll
     ------------------------------------------------------------------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------------------------
     6. NAV — dropdowns (touch/keyboard) + mobile burger
     ------------------------------------------------------------------- */
  const burger = $("#burger");
  const menu = $("#navMenu");
  burger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    lockScroll(open);
  });

  $$(".has-drop > .nav__link").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      if (finePointer && innerWidth > 960) return;   // hover handles desktop; click is for touch/mobile
      const li = btn.parentElement;
      const open = !li.classList.contains("is-open");
      $$(".has-drop.is-open").forEach(o => { if (o !== li) { o.classList.remove("is-open"); o.firstElementChild.setAttribute("aria-expanded", "false"); } });
      li.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open);
    });
  });
  // dropdowns: cascade index for the entrance + a highlight that glides between items
  $$(".drop__grid, .drop--products").forEach(grid => [...grid.children].forEach((it, i) => it.style.setProperty("--i", i)));
  if (finePointer) $$(".drop__grid").forEach(grid => {
    const hl = document.createElement("i"); hl.className = "drop__hl"; hl.setAttribute("aria-hidden", "true"); grid.prepend(hl);
    const move = it => { hl.style.transform = `translate(${it.offsetLeft}px,${it.offsetTop}px)`; hl.style.width = it.offsetWidth + "px"; hl.style.height = it.offsetHeight + "px"; };
    $$(".drop__item", grid).forEach(it => it.addEventListener("mouseenter", () => {
      if (!grid.classList.contains("has-hl")) { hl.style.transition = "none"; move(it); hl.offsetWidth; hl.style.transition = ""; }
      move(it); grid.classList.add("has-hl");
    }));
    grid.addEventListener("mouseleave", () => grid.classList.remove("has-hl"));
  });
  // close the mobile menu after choosing a link
  $$(".nav__menu a").forEach(a => a.addEventListener("click", () => { if (menu.classList.contains("is-open")) burger.click(); }));
  // links whose pages are not built yet
  $$("a[data-soon]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); toast("Coming soon"); }));
  document.addEventListener("click", e => {
    if (!e.target.closest(".has-drop")) {
      $$(".has-drop.is-open").forEach(o => { o.classList.remove("is-open"); o.firstElementChild.setAttribute("aria-expanded", "false"); });
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      $$(".has-drop.is-open").forEach(o => o.classList.remove("is-open"));
      if (menu.classList.contains("is-open")) burger.click();
    }
  });

  // dev helper: ?drop=N opens the Nth dropdown for screenshots
  const dropIdx = new URLSearchParams(location.search).get("drop");
  if (new URLSearchParams(location.search).has("menu")) burger.click();
  if (dropIdx !== null) $$(".has-drop")[+dropIdx]?.classList.add("is-open");

  // scroll-spy: highlight the nav item for the section in view
  const spyLinks = $$(".nav__link[data-spy]");
  const setSpy = id => spyLinks.forEach(l => l.classList.toggle("is-active", l.dataset.spy === id));
  ["hero", "products", "landmarks", "why", "calculator", "media", "quote"].forEach(id => {
    const sec = document.getElementById(id); if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onEnter: () => setSpy(id), onEnterBack: () => setSpy(id) });
  });

  /* -------------------------------------------------------------------
     7. HERO PARALLAX on scroll
     ------------------------------------------------------------------- */
  if (!reduceMotion) {
    gsap.to(".hero__video", {
      yPercent: 18, scale: 1.1, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__in", {
      yPercent: -10, opacity: .2, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  }

  /* -------------------------------------------------------------------
     8. CUSTOM CURSOR + MAGNETIC BUTTONS (desktop only)
     ------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    const cursor = $("#cursor");
    const label = $(".cursor__label");
    const xTo = gsap.quickTo(cursor, "x", { duration: .18, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: .18, ease: "power3" });
    addEventListener("mousemove", e => { xTo(e.clientX); yTo(e.clientY); });

    $$("a, button, [data-cursor]").forEach(el => {
      el.addEventListener("mouseenter", () => {
        if (el.dataset.cursor) { label.textContent = el.dataset.cursor; cursor.classList.add("is-label"); }
        else cursor.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover", "is-label"));
    });

    $$(".btn--magnetic").forEach(btn => {
      const strength = 0.35;
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        gsap.to(btn, { x, y, duration: .4, ease: "power3.out" });
      });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.4)" }));
    });
  }

  /* -------------------------------------------------------------------
     9. GENERIC SCROLL REVEALS  ([data-reveal])
     ------------------------------------------------------------------- */
  $$("[data-reveal]").forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: "expo.out",
      onComplete: () => { el.classList.add("is-in"); gsap.set(el, { clearProps: "all" }); },
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  /* -------------------------------------------------------------------
     10. PRODUCTS SHOWCASE — sticky bag switches as panels scroll by
     ------------------------------------------------------------------- */
  const BRANDS = [
    { chips: [["42.5N", "Strength class"], ["50 kg", "Net weight"], ["CEM II/A-M", "Cement type"]] },
    { chips: [["42.5N · SR", "Strength class"], ["50 kg", "Net weight"], ["CEM II/A-M", "Cement type"]] },
    { chips: [["BDS EN 197-1", "Standard"], ["50 kg", "Net weight"], ["PCC", "Cement type"]] },
  ];
  const panels = $$(".panel");
  const bags = $$(".bag");
  const dots = $$(".stage__dots i");
  const nums = $$("#stageNum i");
  const chips = [$("#chipA"), $("#chipB"), $("#chipC")];
  let activeBrand = -1;

  const animateMeters = panel => {
    $$(".meter__bar i", panel).forEach(bar => gsap.fromTo(bar, { width: 0 }, { width: bar.dataset.fill + "%", duration: 1.4, ease: "expo.out", delay: .15 }));
    $$(".meter__row b", panel).forEach(el => {
      const to = parseFloat(el.dataset.count), suf = el.dataset.suffix || "", obj = { v: 0 };
      const dec = String(el.dataset.count).includes(".") ? 1 : 0;
      gsap.to(obj, { v: to, duration: 1.4, ease: "expo.out", delay: .15, onUpdate: () => (el.textContent = obj.v.toFixed(dec) + suf) });
    });
  };

  const setBrand = i => {
    if (i === activeBrand) return;
    const prev = activeBrand;
    activeBrand = i;
    panels.forEach((p, k) => p.classList.toggle("is-active", k === i));
    bags.forEach((b, k) => {
      b.classList.toggle("is-active", k === i);
      b.classList.toggle("is-leaving", k === prev);
    });
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    nums.forEach(n => (n.style.transform = `translateY(${-i * 100}%)`));
    chips.forEach((c, k) => {
      c.classList.add("is-swap");
      setTimeout(() => {
        const [val, label] = BRANDS[i].chips[k];
        c.querySelector("b").textContent = val; c.querySelector("span").textContent = label;
        c.classList.remove("is-swap");
      }, 260 + k * 80);
    });
    animateMeters(panels[i]);
  };

  panels.forEach((panel, i) => {
    ScrollTrigger.create({
      trigger: panel, start: "top 55%", end: "bottom 55%",
      onEnter: () => setBrand(i), onEnterBack: () => setBrand(i),
    });
  });
  // make sure meters/bag exist even before scrolling reaches the section
  setBrand(0);

  /* segmented toggle: showcase <-> compare */
  const seg = $(".seg");
  const showcase = $("#showcase");
  const compare = $("#compare");
  $$(".seg__btn").forEach(btn => btn.addEventListener("click", () => {
    if (btn.classList.contains("is-active")) return;
    $$(".seg__btn").forEach(b => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-selected", b === btn); });
    const toCompare = btn.dataset.mode === "compare";
    seg.classList.toggle("is-right", toCompare);
    const out = toCompare ? showcase : compare, inn = toCompare ? compare : showcase;
    gsap.to(out, { opacity: 0, y: 20, duration: .35, ease: "power2.in", onComplete: () => {
      out.hidden = true; inn.hidden = false;
      gsap.fromTo(inn, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: "expo.out", clearProps: "transform" });
      if (toCompare) gsap.from(".cmp__row", { opacity: 0, y: 14, stagger: .05, duration: .7, ease: "expo.out", delay: .1 });
      ScrollTrigger.refresh();
    }});
  }));

  /* -------------------------------------------------------------------
     11. CEMENT FINDER
     ------------------------------------------------------------------- */
  const FINDER = {
    foundation: { b: 0, why: "High early and long-term strength with low permeability for load-bearing foundations." },
    slab:       { b: 1, why: "Fine grind and a crack-resistant finish for roof slabs and columns, with sulphate protection built in." },
    coastal:    { b: 1, why: "Sulphate-resisting chemistry protects against saline soil and aggressive groundwater." },
    plaster:    { b: 2, why: "A smooth, workable mix that finishes cleanly on plaster and brickwork." },
    bridge:     { b: 0, why: "Flagship AM Grade specified on bridges, power plants and mass-concrete pours." },
    home:       { b: 2, why: "Reliable strength at an honest price for residential slabs, floors and walls." },
  };
  const BRAND_META = [
    { name: "Anwar Cement Special", img: "assets/img/products/anwar-special.webp" },
    { name: "Shoktiman Cement",     img: "assets/img/products/shoktiman.webp" },
    { name: "Lion Cement",          img: "assets/img/products/lion.webp" },
  ];
  const fImg = $("#finderImg"), fName = $("#finderName"), fWhy = $("#finderWhy"), fRes = $("#finderResult");
  $$("#finderChips .chipbtn").forEach(btn => btn.addEventListener("click", () => {
    $$("#finderChips .chipbtn").forEach(b => b.classList.toggle("is-active", b === btn));
    const r = FINDER[btn.dataset.job], m = BRAND_META[r.b];
    gsap.to(fRes, { opacity: 0, y: 10, duration: .2, onComplete: () => {
      fImg.src = bagSrc(m.img); fName.textContent = m.name; fWhy.textContent = r.why;
      gsap.to(fRes, { opacity: 1, y: 0, duration: .6, ease: "expo.out" });
    }});
  }));

  /* -------------------------------------------------------------------
     12. LANDMARKS — pinned horizontal gallery (desktop), native scroll (mobile)
     ------------------------------------------------------------------- */
  const gallery = $("#gallery"), track = $("#galleryTrack");
  const galCur = $("#galCur"), galBar = $("#galBar"), galTotal = $("#galTotal");
  const cards = $$(".lcard");
  galTotal.textContent = String(cards.length).padStart(2, "0");

  ScrollTrigger.matchMedia({
    "(min-width: 901px)": () => {
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: "#landmarks", start: "top 72px", end: () => "+=" + dist(),
          pin: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: self => {
            galBar.style.width = (self.progress * 100) + "%";
            galCur.textContent = String(Math.min(cards.length, Math.floor(self.progress * cards.length) + 1)).padStart(2, "0");
          },
        },
      });
    },
    "(max-width: 900px)": () => {
      track.addEventListener("scroll", () => {
        const p = track.scrollLeft / (track.scrollWidth - track.clientWidth);
        galBar.style.width = (p * 100) + "%";
        galCur.textContent = String(Math.min(cards.length, Math.floor(p * cards.length) + 1)).padStart(2, "0");
      }, { passive: true });
    },
  });

  /* -------------------------------------------------------------------
     13. NETWORK MAP — dot-matrix Bangladesh with interactive markers
     ------------------------------------------------------------------- */
  // Simplified national outline (lon, lat), clockwise from the northern tip.
  const BD = [[88.40,26.62],[88.75,26.45],[89.05,26.30],[89.45,26.20],[89.70,26.15],[89.88,25.95],[89.82,25.60],[89.86,25.30],
    [90.20,25.22],[90.60,25.18],[91.00,25.20],[91.40,25.14],[91.90,25.16],[92.25,25.05],[92.45,24.85],[92.30,24.35],[92.05,24.15],
    [91.75,24.05],[91.55,23.70],[91.20,23.60],[91.20,23.30],[91.45,23.05],[91.70,23.10],[91.95,23.20],[92.25,23.25],[92.60,22.80],
    [92.68,22.20],[92.50,21.70],[92.35,21.20],[92.28,20.75],[92.05,21.05],[91.95,21.60],[91.80,22.10],[91.55,22.40],[91.30,22.60],
    [91.05,22.55],[90.85,22.40],[90.65,22.20],[90.45,21.95],[90.15,21.80],[89.85,21.70],[89.55,21.62],[89.25,21.60],[89.05,21.72],
    [88.95,22.10],[88.85,22.55],[88.95,23.05],[88.70,23.35],[88.55,23.65],[88.72,24.00],[88.35,24.30],[88.05,24.68],[88.15,25.10],
    [88.45,25.30],[88.20,25.72],[88.10,26.05],[88.30,26.35]];
  const LON0 = 87.95, LON1 = 92.80, LAT0 = 20.65, LAT1 = 26.75, W = 600, H = 850;
  const px = lon => (lon - LON0) / (LON1 - LON0) * W;
  const py = lat => H - (lat - LAT0) / (LAT1 - LAT0) * H;
  const inside = (x, y) => { let ok = false;
    for (let i = 0, j = BD.length - 1; i < BD.length; j = i++) {
      const xi = px(BD[i][0]), yi = py(BD[i][1]), xj = px(BD[j][0]), yj = py(BD[j][1]);
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ok = !ok;
    } return ok; };

  const PLACES = [
    { t: "plant",   n: "Anwar Cement Plant, Gazaria", l: "Munshiganj", lon: 90.62, lat: 23.52, d: "Our manufacturing hub on the bank of the Meghna in Munshiganj, with river access for clinker import and nationwide dispatch." },
    { t: "plant",   n: "Head Office, Dhaka",          l: "Dhaka",      lon: 90.40, lat: 23.78, d: "Anwar Group corporate headquarters. Sales, technical services and customer support are coordinated from here." },
    { t: "depot",   n: "Chattogram Depot",  l: "Chattogram", lon: 91.83, lat: 22.36, d: "Serving the port city and the south-east, including Cox's Bazar and the hill districts." },
    { t: "depot",   n: "Khulna Depot",      l: "Khulna",     lon: 89.56, lat: 22.82, d: "Coverage for the south-west and the coastal belt, where sulphate-resisting cement is in highest demand." },
    { t: "depot",   n: "Rajshahi Depot",    l: "Rajshahi",   lon: 88.60, lat: 24.37, d: "Supplying the north-west, from Chapainawabganj to Natore." },
    { t: "depot",   n: "Sylhet Depot",      l: "Sylhet",     lon: 91.87, lat: 24.90, d: "Serving the north-east and its fast-growing residential market." },
    { t: "depot",   n: "Rangpur Depot",     l: "Rangpur",    lon: 89.25, lat: 25.75, d: "Coverage for the northern districts up to Panchagarh and Thakurgaon." },
    { t: "depot",   n: "Barishal Depot",    l: "Barishal",   lon: 90.37, lat: 22.70, d: "River-linked supply into the southern delta and the Payra corridor." },
    { t: "depot",   n: "Mymensingh Depot",  l: "Mymensingh", lon: 90.41, lat: 24.75, d: "Serving the greater Mymensingh region and the northern belt of Dhaka division." },
    { t: "depot",   n: "Cumilla Depot",     l: "Cumilla",    lon: 91.18, lat: 23.46, d: "Coverage along the Dhaka–Chattogram highway and the eastern border districts." },
    { t: "depot",   n: "Bogura Depot",      l: "Bogura",     lon: 89.37, lat: 24.85, d: "Central-north distribution hub for Bogura, Sirajganj and Joypurhat." },
    { t: "project", n: "Rooppur Nuclear Power Plant", l: "Pabna",      lon: 89.05, lat: 24.07, d: "Bangladesh's first nuclear power project. 2,400 MW." },
    { t: "project", n: "Payra Sea Port",             l: "Patuakhali", lon: 90.27, lat: 21.98, d: "The nation's third seaport, built in aggressive saline ground." },
    { t: "project", n: "Padma Bridge Corridor",       l: "Munshiganj–Shariatpur", lon: 90.26, lat: 23.44, d: "Approach roads and allied works along the country's longest bridge." },
    { t: "project", n: "Mayor Hanif Flyover",         l: "Dhaka",      lon: 90.43, lat: 23.71, d: "The longest flyover in Bangladesh at 11.8 km." },
    { t: "project", n: "BSMMU Super Specialized Hospital", l: "Dhaka", lon: 90.39, lat: 23.74, d: "A 750-bed super specialized hospital in Shahbagh." },
    { t: "project", n: "City Center",                 l: "Motijheel, Dhaka", lon: 90.42, lat: 23.73, d: "37-storey commercial tower in the heart of Motijheel." },
  ];
  const TYPE_LABEL = { plant: "Plant / HQ", depot: "Depot", project: "Landmark project" };

  const svg = $("#mapSvg");
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  // dot matrix
  const defs = el("defs"), mask = el("mask", { id: "mapReveal", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H });
  const maskCircle = el("circle", { cx: W / 2, cy: H / 2, r: 0, fill: "#fff" }); mask.appendChild(maskCircle); defs.appendChild(mask); svg.appendChild(defs);
  const dotsG = el("g", { class: "map__dots" });
  const STEP = 13, mdots = [];
  for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) {
    if (inside(x, y)) { const c = el("circle", { cx: x, cy: y, r: 3.2, class: "mdot" }); dotsG.appendChild(c); mdots.push({ c, x, y }); }
  }
  svg.appendChild(dotsG);

  // markers (rendered after dots so they sit on top; plants last)
  const mkG = el("g", { class: "map__marks" });
  const markers = [];
  [...PLACES].sort((a, b) => (a.t === "plant") - (b.t === "plant")).forEach(pl => {
    const x = px(pl.lon), y = py(pl.lat);
    const g = el("g", { class: `mk mk--${pl.t}`, transform: `translate(${x} ${y})`, tabindex: 0, role: "button", "aria-label": pl.n });
    g.appendChild(el("circle", { r: 10, class: "mk__halo" }));
    g.appendChild(el("circle", { r: pl.t === "plant" ? 7 : pl.t === "depot" ? 5.5 : 5, class: "mk__core" }));
    const label = el("text", { x: 14, y: 4, class: "mk__label" }); label.textContent = pl.l; g.appendChild(label);
    mkG.appendChild(g);
    markers.push({ g, pl, x, y });
  });
  svg.appendChild(mkG);

  const tip = $("#mapTip"), mapBox = $("#map");
  const ncType = $("#ncType"), ncName = $("#ncName"), ncDesc = $("#ncDesc"), ncLoc = $("#ncLoc");
  let activeMk = null, tourTimer = null, tourIdx = 0, hovering = false;

  const litDots = (x, y) => mdots.forEach(d => {
    const dist = Math.hypot(d.x - x, d.y - y), lit = dist < 40;
    d.c.classList.toggle("is-lit", lit);
    d.c.setAttribute("r", lit ? (3.2 + (1 - dist / 40) * 2.6).toFixed(1) : 3.2);
  });

  const activate = (m, showTip = true) => {
    if (activeMk) activeMk.g.classList.remove("is-active");
    activeMk = m; m.g.classList.add("is-active");
    litDots(m.x, m.y);
    gsap.fromTo("#netcard", { opacity: .4, y: 6 }, { opacity: 1, y: 0, duration: .5, ease: "expo.out" });
    ncType.textContent = TYPE_LABEL[m.pl.t]; ncName.textContent = m.pl.n; ncDesc.textContent = m.pl.d; ncLoc.textContent = m.pl.l;
    if (showTip) {
      const r = svg.getBoundingClientRect(), b = mapBox.getBoundingClientRect();
      tip.style.left = (r.left - b.left + m.x / W * r.width) + "px";
      tip.style.top  = (r.top - b.top + m.y / H * r.height) + "px";
      tip.querySelector("b").textContent = m.pl.n; tip.querySelector("span").textContent = TYPE_LABEL[m.pl.t] + " · " + m.pl.l;
      tip.classList.add("is-on");
    }
  };

  markers.forEach(m => {
    m.g.addEventListener("mouseenter", () => { hovering = true; activate(m); });
    m.g.addEventListener("mouseleave", () => { hovering = false; tip.classList.remove("is-on"); });
    m.g.addEventListener("click", () => activate(m));
    m.g.addEventListener("focus", () => activate(m));
  });

  // layer filter
  let currentLayer = "all";
  $$("#layers .layer").forEach(btn => btn.addEventListener("click", () => {
    $$("#layers .layer").forEach(b => b.classList.toggle("is-active", b === btn));
    currentLayer = btn.dataset.layer;
    markers.forEach(m => m.g.classList.toggle("is-hidden", currentLayer !== "all" && m.pl.t !== currentLayer));
    const first = markers.find(m => currentLayer === "all" ? m.pl.t === "plant" : m.pl.t === currentLayer);
    if (first) activate(first, false);
    tourIdx = 0;
  }));

  // auto tour: gently cycles through visible markers while the map is on screen
  const visible = () => markers.filter(m => currentLayer === "all" || m.pl.t === currentLayer);
  const startTour = () => { stopTour(); tourTimer = setInterval(() => { if (hovering) return; const v = visible(); if (!v.length) return; tourIdx = (tourIdx + 1) % v.length; activate(v[tourIdx], false); }, 2800); };
  const stopTour = () => { clearInterval(tourTimer); tourTimer = null; };

  ScrollTrigger.create({
    trigger: "#network", start: "top 70%", end: "bottom 30%",
    onEnter: startTour, onEnterBack: startTour, onLeave: stopTour, onLeaveBack: stopTour,
    onToggle: self => { if (self.isActive && !$("#network").dataset.counted) {
      $("#network").dataset.counted = 1;
      $$(".count-v").forEach(c => { const o = { v: 0 }; gsap.to(o, { v: +c.dataset.to, duration: 1.6, ease: "power3.out", onUpdate: () => (c.textContent = Math.round(o.v).toLocaleString("en-US")) }); });
      gsap.to(maskCircle, { attr: { r: Math.hypot(W, H) / 2 + 20 }, duration: 1.4, ease: "power2.out", onComplete: () => dotsG.removeAttribute("style") });
      gsap.from(".map__marks .mk", { opacity: 0, stagger: .05, duration: .7, ease: "power2.out", delay: .8, clearProps: "opacity" });
    } },
  });
  activate(markers.find(m => m.pl.t === "plant"), false);

  /* -------------------------------------------------------------------
     14. THE STANDARD — timeline scrub + step activation + bg parallax
     ------------------------------------------------------------------- */
  gsap.to("#processLine", {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: "#process", start: "top 60%", end: "bottom 60%", scrub: .6 },
  });
  $$("[data-step]").forEach(step => ScrollTrigger.create({
    trigger: step, start: "top 62%", end: "bottom 30%",
    onEnter: () => step.classList.add("is-active"), onEnterBack: () => step.classList.add("is-active"),
    onLeaveBack: () => step.classList.remove("is-active"),
  }));
  if (!reduceMotion) gsap.to("#standardBg", { yPercent: 12, ease: "none", scrollTrigger: { trigger: "#why", start: "top bottom", end: "bottom top", scrub: true } });

  /* -------------------------------------------------------------------
     15. STRENGTH CHART — single series + reference threshold
     ------------------------------------------------------------------- */
  const DATA = [ { d: 1, v: 12 }, { d: 2, v: 22 }, { d: 3, v: 27 }, { d: 7, v: 36 }, { d: 14, v: 45 }, { d: 28, v: 52.5 }, { d: 56, v: 58 }, { d: 90, v: 62 } ];
  const REF = 42.5; // BDS EN 197-1 minimum at 28 days for 42.5N
  const cs = $("#chartSvg"), chartBox = $("#chart"), ctip = $("#chartTip");
  const CW = 720, CH = 320, P = { l: 44, r: 70, t: 20, b: 36 };
  const xs = d => P.l + (Math.log(d) / Math.log(90)) * (CW - P.l - P.r);   // log scale: curing days
  const ys = v => CH - P.b - (v / 70) * (CH - P.t - P.b);

  const grid = el("g", { class: "grid" }), axis = el("g", { class: "axis" });
  [0, 20, 40, 60].forEach(v => {
    grid.appendChild(el("line", { x1: P.l, x2: CW - P.r, y1: ys(v), y2: ys(v) }));
    const t = el("text", { x: P.l - 10, y: ys(v) + 4, "text-anchor": "end" }); t.textContent = v; axis.appendChild(t);
  });
  DATA.forEach(pt => { const t = el("text", { x: xs(pt.d), y: CH - P.b + 20, "text-anchor": "middle" }); t.textContent = pt.d === 1 ? "Day 1" : pt.d; axis.appendChild(t); });
  const unit = el("text", { x: P.l - 10, y: P.t - 6, "text-anchor": "end" }); unit.textContent = "MPa"; axis.appendChild(unit);
  cs.appendChild(grid); cs.appendChild(axis);

  // reference threshold
  cs.appendChild(el("line", { class: "ref", x1: P.l, x2: CW - P.r, y1: ys(REF), y2: ys(REF) }));
  const refL = el("text", { class: "ref-label", x: CW - P.r + 8, y: ys(REF) + 4 }); refL.textContent = "42.5 min"; cs.appendChild(refL);

  // area + line
  const lineD = DATA.map((pt, i) => (i ? "L" : "M") + xs(pt.d).toFixed(1) + " " + ys(pt.v).toFixed(1)).join(" ");
  const area = el("path", { class: "area", d: lineD + ` L${xs(90).toFixed(1)} ${ys(0)} L${xs(1).toFixed(1)} ${ys(0)} Z` });
  const line = el("path", { class: "line", d: lineD });
  cs.appendChild(area); cs.appendChild(line);
  const pts = el("g");
  DATA.forEach(pt => pts.appendChild(el("circle", { class: "pt", cx: xs(pt.d), cy: ys(pt.v), r: 4.5 })));
  cs.appendChild(pts);
  const endL = el("text", { class: "end-label", x: xs(90) + 10, y: ys(62) + 5 }); endL.textContent = "62 MPa"; cs.appendChild(endL);
  const d28 = el("text", { class: "end-label", x: xs(28), y: ys(52.5) - 14, "text-anchor": "middle" }); d28.textContent = "52.5 @ 28d"; cs.appendChild(d28);

  // hover layer
  const xline = el("line", { class: "xline", y1: P.t, y2: CH - P.b, x1: 0, x2: 0 });
  const focus = el("circle", { class: "focus", r: 6 });
  cs.appendChild(xline); cs.appendChild(focus);
  const hit = el("rect", { class: "pt-hit", x: P.l, y: P.t, width: CW - P.l - P.r, height: CH - P.t - P.b });
  cs.appendChild(hit);
  const showPt = pt => {
    const x = xs(pt.d), y = ys(pt.v);
    xline.setAttribute("x1", x); xline.setAttribute("x2", x); focus.setAttribute("cx", x); focus.setAttribute("cy", y);
    const r = cs.getBoundingClientRect(), b = chartBox.getBoundingClientRect();
    ctip.style.left = (r.left - b.left + x / CW * r.width) + "px"; ctip.style.top = (r.top - b.top + y / CH * r.height) + "px";
    ctip.querySelector("b").textContent = pt.v + " MPa";
    ctip.querySelector("span").textContent = `Day ${pt.d} · ${pt.v >= REF ? "+" + (pt.v - REF).toFixed(1) + " over minimum" : (REF - pt.v).toFixed(1) + " below 28-day minimum"}`;
    chartBox.classList.add("is-hover"); ctip.classList.add("is-on");
  };
  hit.addEventListener("mousemove", e => {
    const r = cs.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * CW;
    let best = DATA[0]; DATA.forEach(pt => { if (Math.abs(xs(pt.d) - mx) < Math.abs(xs(best.d) - mx)) best = pt; });
    showPt(best);
  });
  hit.addEventListener("mouseleave", () => { chartBox.classList.remove("is-hover"); ctip.classList.remove("is-on"); });

  // draw-on animation
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set([area, endL, d28], { opacity: 0 });
  gsap.set(".chart .pt", { scale: 0, transformOrigin: "center" });
  ScrollTrigger.create({
    trigger: "#chart", start: "top 80%", once: true,
    onEnter: () => {
      gsap.to(line, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" });
      gsap.to(".chart .pt", { scale: 1, duration: .5, stagger: .18, ease: "back.out(2)", delay: .6 });
      gsap.to(area, { opacity: .1, duration: 1, delay: 1.4 });
      gsap.to([d28, endL], { opacity: 1, duration: .6, delay: 1.8, stagger: .2 });
    },
  });

  // table view
  const tb = $("#chartTable tbody");
  DATA.forEach(pt => { const tr = document.createElement("tr"); tr.innerHTML = `<td>${pt.d}</td><td>${pt.v}</td><td>${pt.d === 28 ? REF : "–"}</td>`; tb.appendChild(tr); });
  $("#chartTableBtn").addEventListener("click", e => {
    const t = $("#chartTable"), open = t.hidden; t.hidden = !open;
    e.currentTarget.textContent = open ? "Hide table" : "View as table"; e.currentTarget.setAttribute("aria-expanded", open);
    ScrollTrigger.refresh();
  });

  const toast = msg => { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("is-on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("is-on"), 2200); };

  if ($("#calculator")) window.AC_initCalculator({ $, $$, toast, bagSrc });

  /* -------------------------------------------------------------------
     17. DEALER LOCATOR
     ------------------------------------------------------------------- */
  const DEALERS = [
    { n: "Rahman Traders",        d: "Dhaka",       u: "Mirpur",        dv: "Dhaka",      a: "Shop 12, Mirpur-10 Bus Stand, Dhaka 1216", p: "01711000001", lat: 23.807, lon: 90.368 },
    { n: "Bismillah Enterprise",  d: "Dhaka",       u: "Jatrabari",     dv: "Dhaka",      a: "45 Jatrabari Chowrasta, Dhaka 1204",        p: "01711000002", lat: 23.710, lon: 90.434 },
    { n: "Meghna Cement House",   d: "Munshiganj",  u: "Gazaria",       dv: "Dhaka",      a: "Bhaterchar Bazar, Gazaria, Munshiganj",     p: "01711000003", lat: 23.520, lon: 90.610 },
    { n: "Narayanganj Hardware",  d: "Narayanganj", u: "Sadar",         dv: "Dhaka",      a: "2 No. Rail Gate, Narayanganj 1400",          p: "01711000004", lat: 23.623, lon: 90.500 },
    { n: "Gazipur Build Mart",    d: "Gazipur",     u: "Tongi",         dv: "Dhaka",      a: "Tongi Station Road, Gazipur 1710",          p: "01711000005", lat: 23.895, lon: 90.404 },
    { n: "Port City Cement",      d: "Chattogram",  u: "Agrabad",       dv: "Chattogram", a: "Sheikh Mujib Road, Agrabad, Chattogram",     p: "01711000006", lat: 22.330, lon: 91.812 },
    { n: "Hill Track Traders",    d: "Cox's Bazar", u: "Sadar",         dv: "Chattogram", a: "Main Road, Cox's Bazar 4700",               p: "01711000007", lat: 21.435, lon: 91.972 },
    { n: "Gomti Enterprise",      d: "Cumilla",     u: "Kandirpar",     dv: "Chattogram", a: "Kandirpar Circle, Cumilla 3500",            p: "01711000008", lat: 23.462, lon: 91.180 },
    { n: "Sundarban Traders",     d: "Khulna",      u: "Sonadanga",     dv: "Khulna",     a: "Sonadanga Bus Terminal Road, Khulna",       p: "01711000009", lat: 22.815, lon: 89.545 },
    { n: "Jessore Cement Point",  d: "Jashore",     u: "Sadar",         dv: "Khulna",     a: "Dhaka Road, Jashore 7400",                  p: "01711000010", lat: 23.170, lon: 89.209 },
    { n: "Padma Traders",         d: "Rajshahi",    u: "Boalia",        dv: "Rajshahi",   a: "Shaheb Bazar, Rajshahi 6100",               p: "01711000011", lat: 24.365, lon: 88.600 },
    { n: "Ishwardi Hardware",     d: "Pabna",       u: "Ishwardi",      dv: "Rajshahi",   a: "Rooppur Road, Ishwardi, Pabna",             p: "01711000012", lat: 24.130, lon: 89.060 },
    { n: "Karatoa Enterprise",    d: "Bogura",      u: "Sadar",         dv: "Rajshahi",   a: "Satmatha, Bogura 5800",                     p: "01711000013", lat: 24.850, lon: 89.372 },
    { n: "Surma Cement",          d: "Sylhet",      u: "Zindabazar",    dv: "Sylhet",     a: "Zindabazar Point, Sylhet 3100",             p: "01711000014", lat: 24.895, lon: 91.870 },
    { n: "Teesta Traders",        d: "Rangpur",     u: "Sadar",         dv: "Rangpur",    a: "Jahaj Company More, Rangpur 5400",          p: "01711000015", lat: 25.746, lon: 89.250 },
    { n: "Dinajpur Build Depot",  d: "Dinajpur",    u: "Sadar",         dv: "Rangpur",    a: "Modern More, Dinajpur 5200",                p: "01711000016", lat: 25.627, lon: 88.637 },
    { n: "Kirtankhola Cement",    d: "Barishal",    u: "Sadar",         dv: "Barishal",   a: "Nathullabad Bus Stand, Barishal 8200",      p: "01711000017", lat: 22.705, lon: 90.370 },
    { n: "Payra Hardware",        d: "Patuakhali",  u: "Kalapara",      dv: "Barishal",   a: "Kalapara Bazar, Patuakhali",                p: "01711000018", lat: 21.985, lon: 90.240 },
    { n: "Brahmaputra Traders",   d: "Mymensingh",  u: "Sadar",         dv: "Mymensingh", a: "Charpara, Mymensingh 2200",                 p: "01711000019", lat: 24.755, lon: 90.405 },
    { n: "Netrokona Cement",      d: "Netrokona",   u: "Sadar",         dv: "Mymensingh", a: "Moktarpara, Netrokona 2400",                p: "01711000020", lat: 24.880, lon: 90.727 },
  ];
  const dlList = $("#dlList"), dlSearch = $("#dlSearch"), dlCount = $("#dlCount"), dlSort = $("#dlSort"), dlMap = $("#dlMap");
  let dlDiv = "all", you = null, dlMarkers = new Map();
  const DL_INITIAL = 6; let dlShowAll = false;

  // mini dot map (same look as the network map: dot matrix + markers)
  const dlDots = [];
  const dg = el("g");
  for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) if (inside(x, y)) { const c = el("circle", { cx: x, cy: y, r: 3.2, class: "mdot" }); dg.appendChild(c); dlDots.push({ c, x, y }); }
  dlMap.appendChild(dg);
  const dmG = el("g"); dlMap.appendChild(dmG);
  DEALERS.forEach(d => {
    const x = px(d.lon), y = py(d.lat);
    const g = el("g", { class: "mk mk--depot", transform: `translate(${x} ${y})`, tabindex: 0, role: "button", "aria-label": d.n });
    g.appendChild(el("circle", { r: 10, class: "mk__halo" }));
    g.appendChild(el("circle", { r: 5.5, class: "mk__core" }));
    const label = el("text", { x: 14, y: 4, class: "mk__label" }); label.textContent = d.d; g.appendChild(label);
    g.addEventListener("click", () => { dlSearch.value = d.d; renderDealers(); });
    g.addEventListener("mouseenter", () => litDealer(d));
    g.addEventListener("mouseleave", () => litDealer(null));
    dmG.appendChild(g); dlMarkers.set(d, { g, x, y });
  });
  const youG = el("g", { class: "youG" }); dlMap.appendChild(youG);
  let litD = null;
  const litDealer = d => {
    if (litD) dlMarkers.get(litD).g.classList.remove("is-active");
    litD = d;
    if (!d) { dlDots.forEach(o => { o.c.classList.remove("is-lit"); o.c.setAttribute("r", 3.2); }); return; }
    const m = dlMarkers.get(d); m.g.classList.add("is-active");
    dlDots.forEach(o => { const dist = Math.hypot(o.x - m.x, o.y - m.y), lit = dist < 40; o.c.classList.toggle("is-lit", lit); o.c.setAttribute("r", lit ? (3.2 + (1 - dist / 40) * 2.6).toFixed(1) : 3.2); });
  };

  const km = (a, b) => { const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

  const renderDealers = () => {
    const q = dlSearch.value.trim().toLowerCase();
    let list = DEALERS.filter(d => (dlDiv === "all" || d.dv === dlDiv) && (!q || [d.n, d.d, d.u, d.a].join(" ").toLowerCase().includes(q)));
    if (you) list = list.map(d => ({ ...d, km: km(you, d) })).sort((a, b) => a.km - b.km);
    dlCount.textContent = `${list.length} dealer${list.length === 1 ? "" : "s"}`;
    dlSort.textContent = you ? "Sorted by distance" : q ? `Matching “${dlSearch.value.trim()}”` : "";
    dlList.innerHTML = list.length ? "" : `<li class="dl__empty">No dealer matches. Try a district name, or call our hotline and we'll connect you.</li>`;
    const shown = dlShowAll ? list : list.slice(0, DL_INITIAL);
    shown.forEach((d, i) => {
      const li = document.createElement("li");
      li.className = "dcard";
      li.innerHTML = `<div class="dcard__name"><i></i>${d.n}</div>
        ${d.km != null ? `<span class="dcard__dist">${d.km < 1 ? "< 1" : Math.round(d.km)} km</span>` : `<span class="dcard__dist"></span>`}
        <div class="dcard__addr">${d.a}<br><b>${d.u}, ${d.d}</b></div>
        <div class="dcard__acts">
          <a href="tel:+88${d.p}">Call</a>
          <a class="wa" href="https://wa.me/88${d.p}?text=${encodeURIComponent("Hello " + d.n + ", I'd like to order Anwar Cement.")}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.n + ", " + d.a)}" target="_blank" rel="noopener">Directions</a>
        </div>`;
      const src = DEALERS.find(x => x.n === d.n);
      li.addEventListener("mouseenter", () => litDealer(src));
      li.addEventListener("mouseleave", () => litDealer(null));
      dlList.appendChild(li);
    });
    if (list.length > DL_INITIAL) {
      const li = document.createElement("li"); li.className = "dl__more";
      li.innerHTML = `<button type="button" class="btn btn--outline btn--dark"><span class="btn__label">${dlShowAll ? "Show fewer" : `See all ${list.length} dealers`}</span></button>`;
      li.querySelector("button").addEventListener("click", () => { dlShowAll = !dlShowAll; renderDealers(); if (!dlShowAll) scrollToEl("#dlList", -120); });
      dlList.appendChild(li);
    }
    const names = new Set(list.map(d => d.n));
    DEALERS.forEach(d => dlMarkers.get(d).g.classList.toggle("is-hidden", !names.has(d.n)));
    if (list.length === 1) litDealer(DEALERS.find(x => x.n === list[0].n)); else litDealer(null);
    gsap.from(dlList.children, { opacity: 0, y: 10, stagger: .04, duration: .5, ease: "power2.out", clearProps: "all" });
  };
  dlSearch.addEventListener("input", () => { you = null; youG.innerHTML = ""; dlShowAll = false; renderDealers(); });
  $$("#dlDivs .chipbtn").forEach(b => b.addEventListener("click", () => { $$("#dlDivs .chipbtn").forEach(x => x.classList.toggle("is-active", x === b)); dlDiv = b.dataset.div; dlShowAll = false; renderDealers(); }));
  $("#dlNear").addEventListener("click", () => {
    if (!navigator.geolocation) return toast("Location not supported on this device");
    const btn = $("#dlNear"); btn.classList.add("is-busy");
    navigator.geolocation.getCurrentPosition(pos => {
      btn.classList.remove("is-busy");
      you = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      dlSearch.value = ""; dlDiv = "all"; $$("#dlDivs .chipbtn").forEach(x => x.classList.toggle("is-active", x.dataset.div === "all"));
      youG.innerHTML = ""; youG.appendChild(el("circle", { cx: px(you.lon), cy: py(you.lat), r: 10, class: "you-halo" })); youG.appendChild(el("circle", { cx: px(you.lon), cy: py(you.lat), r: 6, class: "you" }));
      renderDealers(); toast("Showing dealers nearest to you");
    }, () => { btn.classList.remove("is-busy"); toast("Couldn't get your location"); }, { timeout: 8000 });
  });
  renderDealers();

  /* POST to the configured endpoint; resolves true when no endpoint is set (WhatsApp-only mode) */
  const postForm = async payload => {
    if (!CFG.FORM_ENDPOINT) return true;
    try {
      const r = await fetch(CFG.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...payload, page: location.href, at: new Date().toISOString() }) });
      return r.ok;
    } catch { return false; }
  };

  /* -------------------------------------------------------------------
     18. QUOTATION — 3-step form
     ------------------------------------------------------------------- */
  const DISTRICTS = ["Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur","Chattogram","Chuadanga","Cox's Bazar","Cumilla","Dhaka","Dinajpur","Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jashore","Jhalokathi","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram","Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur","Moulvibazar","Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi","Natore","Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur","Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj","Sunamganj","Sylhet","Tangail","Thakurgaon"];
  $("#districts").innerHTML = DISTRICTS.map(d => `<option value="${d}">`).join("");
  const qDate = $("#qDate"); qDate.min = new Date().toISOString().slice(0, 10);
  let qStep = 1;
  const qSteps = $$(".qf__step"), qTabs = $$("#qfSteps li");
  const qNext = $("#qfNext"), qBack = $("#qfBack"), qErr = $("#qfErr");

  const qData = () => ({
    who: $("input[name=who]:checked").value, product: $("#qProduct").value, qty: $("#qQty").value + " " + $("#qUnit").value, type: $("#qType").value,
    district: $("#qDistrict").value.trim(), date: qDate.value, address: $("#qAddress").value.trim(), delivery: $("#qDelivery").checked,
    name: $("#qName").value.trim(), phone: $("#qPhone").value.trim(), email: $("#qEmail").value.trim(), notes: $("#qNotes").value.trim(),
  });
  const validate = step => {
    qErr.textContent = "";
    const fields = $$(`.qf__step[data-qstep="${step}"] [required]`);
    let bad = null;
    fields.forEach(f => { const ok = f.checkValidity() && f.value.trim() !== ""; f.classList.toggle("is-invalid", !ok); if (!ok && !bad) bad = f; });
    if (bad) { qErr.textContent = bad.id === "qPhone" ? "Enter a valid Bangladeshi mobile number" : "Please fill in the highlighted fields"; bad.focus(); return false; }
    return true;
  };
  const goStep = n => {
    const dir = n > qStep ? 1 : -1;
    const cur = qSteps[qStep - 1], nxt = qSteps[n - 1];
    gsap.to(cur, { opacity: 0, x: -30 * dir, duration: .25, ease: "power2.in", onComplete: () => {
      cur.classList.remove("is-active"); gsap.set(cur, { clearProps: "all" });
      nxt.classList.add("is-active"); gsap.fromTo(nxt, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: .5, ease: "expo.out", clearProps: "all" });
      ScrollTrigger.refresh();
    }});
    qStep = n;
    qTabs.forEach((t, i) => { t.classList.toggle("is-active", i + 1 === n); t.classList.toggle("is-done", i + 1 < n); });
    qBack.hidden = n === 1;
    qNext.querySelector(".btn__label").textContent = n === 3 ? "Send request" : "Continue";
    if (n === 3) { const d = qData(); $("#qfSummary").innerHTML = `<b>${d.qty}</b> of <b>${d.product}</b> for a ${d.type.toLowerCase()} in <b>${d.district}</b>${d.date ? `, needed by <b>${new Date(d.date).toLocaleDateString("en-GB")}</b>` : ""}. ${d.delivery ? "Delivery to site." : "Ex-depot pickup."}`; }
  };
  qNext.addEventListener("click", async () => {
    if (!validate(qStep)) return;
    if (qStep < 3) return goStep(qStep + 1);
    // submit: POST to CFG.FORM_ENDPOINT when configured, always offer the WhatsApp hand-off
    const d = qData(), ref = "AC-" + Date.now().toString(36).toUpperCase().slice(-6);
    qNext.disabled = true; qNext.querySelector(".btn__label").textContent = "Sending…";
    const sent = await postForm({ type: "quotation", ref, ...d });
    qNext.disabled = false; qNext.querySelector(".btn__label").textContent = "Send request";
    if (!sent) { qErr.textContent = "Couldn't send right now. Use WhatsApp below or call the hotline."; }
    const msg = `Quotation request ${ref}\n${d.who} · ${d.name} · ${d.phone}${d.email ? " · " + d.email : ""}\n${d.qty} × ${d.product}\n${d.type}, ${d.district}\n${d.address}${d.date ? "\nNeeded by " + d.date : ""}\n${d.delivery ? "Delivery to site" : "Ex-depot pickup"}${d.notes ? "\nNotes: " + d.notes : ""}`;
    $("#qfWa").href = "https://wa.me/" + CFG.WHATSAPP + "?text=" + encodeURIComponent(msg);
    $("#qfDoneName").textContent = d.name; $("#qfDonePhone").textContent = d.phone; $("#qfRef").textContent = ref;
    gsap.to([qSteps[2], "#qfNav", "#qfSteps"], { opacity: 0, duration: .3, onComplete: () => {
      qSteps[2].classList.remove("is-active"); $("#qfNav").hidden = true; $("#qfSteps").hidden = true; $("#qfDone").hidden = false;
      gsap.fromTo("#qfDone", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out" });
      ScrollTrigger.refresh();
    }});
    try { localStorage.setItem("ac_last_quote", JSON.stringify({ ref, ...d, at: Date.now() })); } catch {}
  });
  qBack.addEventListener("click", () => goStep(qStep - 1));
  $("#qfAgain").addEventListener("click", () => {
    $("#qfDone").hidden = true; $("#qfNav").hidden = false; $("#qfSteps").hidden = false; gsap.set(["#qfNav", "#qfSteps"], { clearProps: "all" });
    $("#qf").reset(); qSteps.forEach(s => s.classList.remove("is-active")); qStep = 1; qSteps[0].classList.add("is-active");
    qTabs.forEach((t, i) => { t.classList.toggle("is-active", i === 0); t.classList.remove("is-done"); }); qBack.hidden = true; qNext.querySelector(".btn__label").textContent = "Continue";
  });
  $$("#qf [required]").forEach(f => f.addEventListener("input", () => f.classList.remove("is-invalid")));

  /* -------------------------------------------------------------------
     19. TESTIMONIALS — two counter-scrolling rows
     ------------------------------------------------------------------- */
  const VOICES = [
    { q: "We specified Anwar Cement Special for the raft foundation. Cube results came back above 55 MPa at 28 days, every single batch.", n: "Engr. Tanvir Ahmed", r: "Structural Engineer, Dhaka", t: "Engineer", c: "TA" },
    { q: "In Khulna the ground water eats ordinary cement. Shoktiman's sulphate resistance is the reason our basements don't leak.", n: "Md. Rafiqul Islam", r: "Contractor, Khulna", t: "Contractor", c: "RI", red: true },
    { q: "My masons ask for Lion by name. It plasters smooth and doesn't crack in the summer heat.", n: "Shirin Akter", r: "Home owner, Mymensingh", t: "Home owner", c: "SA" },
    { q: "Delivery reaches my godown within two days of ordering. In this business, that reliability is everything.", n: "Abdul Karim", r: "Dealer, Cumilla", t: "Dealer", c: "AK", red: true },
    { q: "Consistent fineness means consistent workability. Our batching plant runs the same mix design month after month.", n: "Engr. Farhana Hossain", r: "QC Manager, ready-mix plant", t: "Engineer", c: "FH" },
    { q: "On the flyover project we poured at night in monsoon conditions. Setting time stayed predictable. That's what we need.", n: "Kamal Uddin", r: "Site Manager, Dhaka", t: "Contractor", c: "KU", red: true },
    { q: "The calculator on their website told me exactly how many bags to buy for my roof. No wastage, no second trip.", n: "Nasir Chowdhury", r: "Home owner, Chattogram", t: "Home owner", c: "NC" },
    { q: "Test certificates arrive with every truck. Our consultants stopped asking for third-party checks.", n: "Engr. Sohel Rana", r: "Project Manager, Sylhet", t: "Engineer", c: "SR", red: true },
  ];
  const star = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .8-5.2 4.9 1.4 7L12 17.8 5.8 21.3l1.4-7L2 9.4l7-.8z"/></svg>`;
  const vcard = v => `<article class="vcard-t"><div class="vcard-t__stars">${star.repeat(5)}</div><p class="vcard-t__q">“${v.q}”</p>
    <div class="vcard-t__who"><span class="vcard-t__av${v.red ? " is-red" : ""}">${v.c}</span><div><b>${v.n}</b><span>${v.r}</span></div><span class="vcard-t__tag">${v.t}</span></div></article>`;
  const rowA = VOICES.slice(0, 4), rowB = VOICES.slice(4);
  $("#vrows").innerHTML = `<div class="vrow">${[...rowA, ...rowA].map(vcard).join("")}</div><div class="vrow vrow--rev">${[...rowB, ...rowB].map(vcard).join("")}</div>`;

  /* -------------------------------------------------------------------
     20. MEDIA — tabs + lightbox
     ------------------------------------------------------------------- */
  $$("#mtabs .mtab").forEach(t => t.addEventListener("click", () => {
    if (t.classList.contains("is-active")) return;
    $$("#mtabs .mtab").forEach(x => { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", x === t); });
    const cur = $(".mpanel.is-active"), nxt = $(`.mpanel[data-panel="${t.dataset.tab}"]`);
    gsap.to(cur, { opacity: 0, y: 12, duration: .25, ease: "power2.in", onComplete: () => {
      cur.classList.remove("is-active"); gsap.set(cur, { clearProps: "all" });
      nxt.classList.add("is-active"); nxt.removeAttribute("data-reveal");
      gsap.fromTo(nxt.children[0].children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: "expo.out", clearProps: "all" });
      ScrollTrigger.refresh();
    }});
  }));

  const lb = $("#lb"), lbBox = $("#lbBox");
  const openLb = html => { lbBox.innerHTML = html; lb.hidden = false; lockScroll(true); gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: .3 }); gsap.fromTo(lbBox, { scale: .94, y: 12 }, { scale: 1, y: 0, duration: .6, ease: "expo.out" }); };
  const closeLb = () => { gsap.to(lb, { opacity: 0, duration: .25, onComplete: () => { lb.hidden = true; lbBox.innerHTML = ""; lockScroll(false); } }); };
  $$(".vcard[data-video]").forEach(b => b.addEventListener("click", () => openLb(`<video src="${b.dataset.video}" controls autoplay playsinline></video>`)));
  $$(".gal__item[data-img]").forEach(b => b.addEventListener("click", () => openLb(`<img src="${b.dataset.img}" alt="">`)));
  $("#lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* -------------------------------------------------------------------
     21. FOOTER bits + floating WhatsApp
     ------------------------------------------------------------------- */
  $("#year").textContent = new Date().getFullYear();
  $("#toTop").addEventListener("click", () => lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: "smooth" }));
  $("#nl").addEventListener("submit", async e => {
    e.preventDefault();
    const email = e.target.querySelector("input").value.trim();
    const ok = await postForm({ type: "newsletter", email });
    toast(ok ? "Subscribed. Welcome aboard." : "Couldn't subscribe right now. Please try again.");
    if (ok) e.target.reset();
  });
  ScrollTrigger.create({ trigger: "#trust", start: "top 80%", onEnter: () => $("#fab").classList.add("is-on"), onLeaveBack: () => $("#fab").classList.remove("is-on") });

  /* -------------------------------------------------------------------
     22. LANGUAGE — EN / বাংলা for headings, nav and CTAs
     ------------------------------------------------------------------- */
  const I18N = window.AC_I18N || {};
  const splitTitle = () => $$("#heroTitle .line").forEach(line => { line.innerHTML = line.innerHTML.trim().split(/\s+/).map(w => `<span class="word" style="transform:none">${w}</span>`).join(" "); });
  const setLang = lang => {
    document.documentElement.lang = lang;
    const i = lang === "bn" ? 1 : 0;
    $$("[data-i18n]").forEach(elm => { const t = I18N[elm.dataset.i18n]; if (t) elm.innerHTML = t[i]; });
    splitTitle();
    try { localStorage.setItem("ac_lang", lang); } catch {}
    ScrollTrigger.refresh();
  };
  $$("[data-lang-toggle]").forEach(b => b.addEventListener("click", () => {
    const next = document.documentElement.lang === "bn" ? "en" : "bn";
    gsap.to("main, section, footer, .header", { opacity: .4, duration: .15, onComplete: () => { setLang(next); gsap.to("main, section, footer, .header", { opacity: 1, duration: .4 }); } });
  }));
  try { const saved = localStorage.getItem("ac_lang"); if (saved === "bn") setLang("bn"); } catch {}

  /* -------------------------------------------------------------------
     23. THEME — light / dark
     ------------------------------------------------------------------- */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const setTheme = (t, animate = true) => {
    const root = document.documentElement;
    if (animate) { root.classList.add("is-theming"); setTimeout(() => root.classList.remove("is-theming"), 450); }
    root.dataset.theme = t;
    try { localStorage.setItem("ac_theme", t); } catch {}
    if (themeMeta) themeMeta.content = t === "dark" ? "#0E0F11" : "#DD2930";
    $$("[data-theme-toggle]").forEach(b => { b.setAttribute("aria-pressed", t === "dark"); b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"); });
    applyBagImages();
  };
  $$("[data-theme-toggle]").forEach(b => b.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark")));
  { const cur = document.documentElement.dataset.theme || "light"; let chosen = null; try { chosen = localStorage.getItem("ac_theme"); } catch {}
    setTheme(cur, false); if (!chosen) { try { localStorage.removeItem("ac_theme"); } catch {} } }
  // follow the OS only until the visitor picks a theme
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => { try { if (!localStorage.getItem("ac_theme")) setTheme(e.matches ? "dark" : "light"); } catch {} });
})();
