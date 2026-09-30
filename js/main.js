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
    nextLayer.play().catch(() => { /* autoplay blocked: poster stays */ });

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
    gsap.to("#heroMedia", {
      yPercent: 18, scale: 1.06, ease: "none",
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
      fImg.src = m.img; fName.textContent = m.name; fWhy.textContent = r.why;
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
      gsap.from(".map__dots circle", { opacity: 0, scale: 0, transformOrigin: "center", stagger: { amount: 1.2, from: "center", grid: "auto" }, duration: .6, ease: "power2.out" });
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
    { name: "Anwar Cement Special", img: "assets/img/products/anwar-special.webp" },
    { name: "Shoktiman Cement",     img: "assets/img/products/shoktiman.webp" },
    { name: "Lion Cement",          img: "assets/img/products/lion.webp" },
  ];
  const cq = id => $("#" + id);
  const num = id => Math.max(0, parseFloat(cq(id).value) || 0);
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
    tweenNum(cq("rBags"), r.bags); tweenNum(cq("rCementKg"), r.cementKg); tweenNum(cq("rSand"), r.sandCft, 1);
    tweenNum(cq("rAgg"), r.aggCft, 1); tweenNum(cq("rBrick"), r.bricks); tweenNum(cq("rWater"), r.water); tweenNum(cq("rCost"), r.cost);
    cq("rVol").textContent = fmt(r.wet, 2) + " m³";
    cq("rVolLabel").textContent = job === "brick" ? "Mortar volume" : job === "plaster" ? "Plaster volume" : "Wet volume";
    $("[data-m=agg]").hidden = r.aggCft === 0; $("[data-m=brick]").hidden = r.bricks === 0;
    const maxCft = Math.max(r.cementKg / 45, r.sandCft, r.aggCft, r.bricks / 40, r.water / 30, 1);
    const bars = { cement: r.cementKg / 45, sand: r.sandCft, agg: r.aggCft, brick: r.bricks / 40, water: r.water / 30 };
    for (const k in bars) gsap.to(`[data-m=${k}] .mats__bar i`, { width: (bars[k] / maxCft * 100) + "%", duration: .8, ease: "expo.out" });
    // bag glyph row (1 glyph = 5 bags, capped)
    const row = cq("bagRow"); row.innerHTML = "";
    const glyphs = Math.min(60, Math.ceil(r.bags / 5));
    for (let i = 0; i < glyphs; i++) { const b = document.createElement("i"); if (i === glyphs - 1 && r.bags % 5 && r.bags % 5 <= 2) b.className = "is-half"; row.appendChild(b); }
    gsap.from(row.children, { opacity: 0, y: 6, stagger: .01, duration: .4, ease: "power2.out" });
    // brand
    const jm = JOB_META[job], bm = BRAND_META2[jm.brand];
    cq("rBrandImg").src = bm.img; cq("rBrandName").textContent = bm.name; cq("rBrandWhy").textContent = jm.why;
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

  const toast = msg => { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("is-on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("is-on"), 2200); };

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

  // mini dot map (reuses the national outline + projection)
  const dg = el("g");
  for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) if (inside(x, y)) dg.appendChild(el("circle", { cx: x, cy: y, r: 3, class: "mdot" }));
  dlMap.appendChild(dg);
  const dmG = el("g"); dlMap.appendChild(dmG);
  DEALERS.forEach(d => { const c = el("circle", { cx: px(d.lon), cy: py(d.lat), r: 6, class: "dm" }); c.addEventListener("click", () => { dlSearch.value = d.d; renderDealers(); }); dmG.appendChild(c); dlMarkers.set(d, c); });
  const youG = el("g", { class: "youG" }); dlMap.appendChild(youG);

  const km = (a, b) => { const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

  const renderDealers = () => {
    const q = dlSearch.value.trim().toLowerCase();
    let list = DEALERS.filter(d => (dlDiv === "all" || d.dv === dlDiv) && (!q || [d.n, d.d, d.u, d.a].join(" ").toLowerCase().includes(q)));
    if (you) list = list.map(d => ({ ...d, km: km(you, d) })).sort((a, b) => a.km - b.km);
    dlCount.textContent = `${list.length} dealer${list.length === 1 ? "" : "s"}`;
    dlSort.textContent = you ? "Sorted by distance" : q ? `Matching “${dlSearch.value.trim()}”` : "";
    dlList.innerHTML = list.length ? "" : `<li class="dl__empty">No dealer matches. Try a district name, or call our hotline and we'll connect you.</li>`;
    list.forEach((d, i) => {
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
      const mk = dlMarkers.get(DEALERS.find(x => x.n === d.n));
      li.addEventListener("mouseenter", () => mk.classList.add("is-active"));
      li.addEventListener("mouseleave", () => mk.classList.remove("is-active"));
      dlList.appendChild(li);
    });
    const names = new Set(list.map(d => d.n));
    DEALERS.forEach(d => dlMarkers.get(d).classList.toggle("is-dim", !names.has(d.n)));
    gsap.from(dlList.children, { opacity: 0, y: 10, stagger: .04, duration: .5, ease: "power2.out", clearProps: "all" });
  };
  dlSearch.addEventListener("input", () => { you = null; youG.innerHTML = ""; renderDealers(); });
  $$("#dlDivs .chipbtn").forEach(b => b.addEventListener("click", () => { $$("#dlDivs .chipbtn").forEach(x => x.classList.toggle("is-active", x === b)); dlDiv = b.dataset.div; renderDealers(); }));
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
  $("#vrows").innerHTML = `<div class="vrow">${[...rowA, ...rowA, ...rowA].map(vcard).join("")}</div><div class="vrow vrow--rev">${[...rowB, ...rowB, ...rowB].map(vcard).join("")}</div>`;

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
  const I18N = {
    "nav.home": ["Home", "হোম"], "nav.company": ["Company", "কোম্পানি"], "nav.products": ["Products", "পণ্য"], "nav.why": ["Why Anwar", "কেন আনোয়ার"],
    "nav.calculator": ["Calculator", "ক্যালকুলেটর"], "nav.media": ["Media", "মিডিয়া"], "nav.contact": ["Contact", "যোগাযোগ"],
    "cta.quote": ["Get a Quotation", "কোটেশন নিন"],
    "hero.l1": ["Building the", "গড়ছি"], "hero.l2": ["<em>strength</em> of", "বাংলাদেশের"], "hero.l3": ["Bangladesh.", "<em>শক্তি</em>।"],
    "hero.lead": ["Premium Portland Composite Cement engineered for bridges, power plants and the homes of millions. Three trusted brands, one uncompromising standard.", "সেতু, বিদ্যুৎকেন্দ্র আর লক্ষ মানুষের ঘরের জন্য তৈরি প্রিমিয়াম পোর্টল্যান্ড কম্পোজিট সিমেন্ট। তিনটি বিশ্বস্ত ব্র্যান্ড, একটাই আপসহীন মান।"],
    "hero.explore": ["Explore Products", "পণ্য দেখুন"], "hero.story": ["Our Story", "আমাদের গল্প"],
    "hero.s1": ["Years of trust", "বছরের আস্থা"], "hero.s2": ["Cement brands", "সিমেন্ট ব্র্যান্ড"], "hero.s3": ["Districts served", "জেলায় সরবরাহ"], "hero.s4": ["Dealers nationwide", "ডিলার সারাদেশে"],
    "trust.label": ["Standing strong in", "দৃঢ়ভাবে দাঁড়িয়ে"],
    "products.eyebrow": ["Our Products", "আমাদের পণ্য"], "products.title": ["Three brands.<br>One standard of <em>strength.</em>", "তিনটি ব্র্যান্ড।<br><em>শক্তির</em> একটাই মান।"],
    "landmarks.eyebrow": ["Built with Anwar", "আনোয়ার দিয়ে গড়া"], "landmarks.title": ["The landmarks that<br>carry our <em>name.</em>", "যে স্থাপনাগুলো বহন করে<br>আমাদের <em>নাম।</em>"],
    "network.eyebrow": ["Nationwide Network", "দেশজুড়ে নেটওয়ার্ক"], "network.title": ["Wherever you build,<br>we're <em>already there.</em>", "যেখানেই গড়ুন,<br>আমরা <em>আগে থেকেই আছি।</em>"],
    "why.eyebrow": ["Why Anwar Cement", "কেন আনোয়ার সিমেন্ট"], "why.title": ["Every bag, the same<br><em>uncompromising</em> standard.", "প্রতিটি ব্যাগে একই<br><em>আপসহীন</em> মান।"],
    "calc.eyebrow": ["Smart Cement Calculator", "স্মার্ট সিমেন্ট ক্যালকুলেটর"], "calc.title": ["Know exactly what<br>your build <em>needs.</em>", "জেনে নিন আপনার নির্মাণে<br>ঠিক কতটা <em>লাগবে।</em>"],
    "dealers.eyebrow": ["Dealer Locator", "ডিলার খুঁজুন"], "dealers.title": ["Find Anwar Cement<br><em>near you.</em>", "আপনার <em>কাছের</em><br>আনোয়ার সিমেন্ট ডিলার।"],
    "quote.title": ["Tell us about<br>your project.", "আপনার প্রজেক্ট<br>সম্পর্কে বলুন।"],
    "voices.eyebrow": ["Voices from the site", "সাইট থেকে বলছি"], "voices.title": ["Trusted by the people<br>who <em>pour it.</em>", "যারা ঢালাই করেন,<br>তাদের <em>আস্থা।</em>"],
    "voices.lead": ["Engineers, contractors, dealers and home-owners across Bangladesh on why they choose Anwar Cement.", "সারা বাংলাদেশের প্রকৌশলী, ঠিকাদার, ডিলার ও গৃহনির্মাতারা কেন আনোয়ার সিমেন্ট বেছে নেন।"],
    "media.eyebrow": ["Media &amp; News", "মিডিয়া ও সংবাদ"], "media.title": ["What's happening<br>at <em>Anwar Cement.</em>", "<em>আনোয়ার সিমেন্টে</em><br>কী হচ্ছে।"],
    "media.news": ["News", "সংবাদ"], "media.videos": ["Videos", "ভিডিও"], "media.gallery": ["Gallery", "গ্যালারি"], "media.allnews": ["All news &amp; press releases", "সব সংবাদ ও প্রেস রিলিজ"],
    "footer.eyebrow": ["Ready to build?", "নির্মাণে প্রস্তুত?"], "footer.title": ["Let's pour something<br>that <em>lasts.</em>", "গড়ি এমন কিছু<br>যা <em>টিকে থাকে।</em>"],
    "footer.hotline": ["Hotline", "হটলাইন"],
    "footer.about": ["Anwar Cement Limited is a concern of Anwar Group of Industries, one of the oldest business houses of Bangladesh. We make Portland Composite Cement to BDS EN 197-1:2015 at our plant in Gazaria, Munshiganj.", "আনোয়ার সিমেন্ট লিমিটেড বাংলাদেশের অন্যতম প্রাচীন ব্যবসায়িক প্রতিষ্ঠান আনোয়ার গ্রুপ অব ইন্ডাস্ট্রিজের একটি প্রতিষ্ঠান। মুন্সীগঞ্জের গজারিয়ায় আমাদের কারখানায় BDS EN 197-1:2015 মান অনুযায়ী পোর্টল্যান্ড কম্পোজিট সিমেন্ট তৈরি হয়।"],
    "footer.products": ["Products", "পণ্য"], "footer.compare": ["Compare brands", "ব্র্যান্ড তুলনা"], "footer.datasheets": ["Datasheets", "ডেটাশিট"],
    "footer.company": ["Company", "কোম্পানি"], "footer.about_link": ["About us", "আমাদের সম্পর্কে"], "footer.quality": ["Quality &amp; process", "মান ও প্রক্রিয়া"], "footer.projects": ["Landmark projects", "স্থাপনা প্রকল্প"], "footer.careers": ["Careers", "ক্যারিয়ার"], "footer.news": ["News", "সংবাদ"],
    "footer.tools": ["Tools", "টুলস"], "footer.calculator": ["Cement calculator", "সিমেন্ট ক্যালকুলেটর"], "footer.dealers": ["Dealer locator", "ডিলার খুঁজুন"], "footer.quote": ["Get a quotation", "কোটেশন নিন"], "footer.dealerlogin": ["Dealer login", "ডিলার লগইন"],
    "footer.newsletter": ["Stay updated", "আপডেট থাকুন"], "footer.newsletter_text": ["Product news, price updates and technical guides, once a month.", "পণ্যের খবর, দামের আপডেট ও টেকনিক্যাল গাইড, মাসে একবার।"],
    "footer.plant": ["Plant", "কারখানা"], "footer.office": ["Office", "অফিস"], "footer.group": ["An Anwar Group company", "আনোয়ার গ্রুপের একটি প্রতিষ্ঠান"], "footer.privacy": ["Privacy", "গোপনীয়তা"], "footer.terms": ["Terms", "শর্তাবলী"],
    "fab": ["Chat with us", "চ্যাট করুন"],
    "products.lead": ["Every bag is Portland Composite Cement made to BDS EN 197-1:2015, tested batch by batch in our own laboratory.", "প্রতিটি ব্যাগ BDS EN 197-1:2015 মান অনুযায়ী তৈরি পোর্টল্যান্ড কম্পোজিট সিমেন্ট, আমাদের নিজস্ব ল্যাবে প্রতিটি ব্যাচ পরীক্ষিত।"],
    "landmarks.lead": ["From a nuclear power plant to the capital's skyline, Anwar Cement is poured into the structures Bangladesh depends on every day.", "পারমাণবিক বিদ্যুৎকেন্দ্র থেকে রাজধানীর আকাশরেখা, বাংলাদেশ প্রতিদিন যে স্থাপনাগুলোর উপর নির্ভর করে সেখানে আছে আনোয়ার সিমেন্ট।"],
    "network.lead": ["One plant on the Meghna, a depot network across every division, and dealers in all 64 districts.", "মেঘনার তীরে একটি কারখানা, প্রতিটি বিভাগে ডিপো নেটওয়ার্ক, আর ৬৪ জেলায় ডিলার।"],
    "why.lead": ["From the clinker we import to the bag we seal, five controlled steps make sure the strength on the label is the strength in your concrete.", "আমদানি করা ক্লিংকার থেকে সিল করা ব্যাগ পর্যন্ত পাঁচটি নিয়ন্ত্রিত ধাপ নিশ্চিত করে, লেবেলের শক্তিই আপনার কংক্রিটের শক্তি।"],
    "calc.lead": ["Enter your dimensions and get cement bags, sand, aggregate, bricks and an estimated cost in seconds. Share it with your mason or dealer on WhatsApp.", "মাপ দিন, সেকেন্ডেই জেনে নিন সিমেন্ট ব্যাগ, বালি, খোয়া, ইট আর আনুমানিক খরচ। হোয়াটসঅ্যাপে মিস্ত্রি বা ডিলারকে পাঠিয়ে দিন।"],
    "dealers.lead": ["Authorised dealers in all 64 districts. Search by district or dealer name, or let us find the closest one to you.", "৬৪ জেলায় অনুমোদিত ডিলার। জেলা বা ডিলারের নাম দিয়ে খুঁজুন, অথবা আপনার সবচেয়ে কাছেরটা আমরা খুঁজে দিই।"],
    "quote.lead": ["Three quick steps. A member of our sales team will call you back with pricing and delivery options.", "তিনটি সহজ ধাপ। আমাদের সেলস টিম দাম ও ডেলিভারির তথ্যসহ আপনাকে কল করবে।"],
    "calc.slab": ["RCC Slab", "ছাদ ঢালাই"], "calc.column": ["Column / Beam", "কলাম / বিম"], "calc.plaster": ["Plaster", "প্লাস্টার"], "calc.brick": ["Brickwork", "ইটের গাঁথুনি"], "calc.floor": ["Flooring (PCC)", "মেঝে (PCC)"],
    "calc.need": ["You will need approximately", "আপনার আনুমানিক লাগবে"], "calc.bags": ["bags", "ব্যাগ"], "calc.of50": ["of 50 kg cement", "৫০ কেজি সিমেন্ট"], "calc.share": ["Share on WhatsApp", "হোয়াটসঅ্যাপে পাঠান"],
    "quote.s1": ["What do you need?", "আপনার কী প্রয়োজন?"], "quote.s2": ["Where and when?", "কোথায় এবং কবে?"], "quote.s3": ["How do we reach you?", "আপনার সাথে যোগাযোগ করব কীভাবে?"],
    "finder.title": ["What are you building?", "আপনি কী বানাচ্ছেন?"], "finder.lead": ["Pick a job and we'll point you to the right bag.", "কাজটি বেছে নিন, আমরা সঠিক ব্যাগটি দেখিয়ে দেব।"],
  };
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
})();
