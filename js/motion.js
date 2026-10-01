/* =====================================================================
   ANWAR CEMENT — motion.js  (shared motion layer, loaded after main.js / page.js)
   Scroll progress, smart header, heading line reveals, image wipes,
   circular theme reveal. Page-to-page transitions live in CSS (@view-transition).
   ===================================================================== */
(() => {
  "use strict";
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "expo.out";

  /* -------------------------------------------------------------------
     1. THEME — circular reveal from the toggle (View Transitions)
     main.js / page.js call this with a function that applies the theme.
     ------------------------------------------------------------------- */
  window.AC_themeSwap = (btn, apply) => {
    if (!document.startViewTransition || reduceMotion) return apply(true);
    const r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("vt-theme");
    const vt = document.startViewTransition(() => apply(false));
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
      { duration: 850, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
    )).catch(() => {});
    vt.finished.finally(() => root.classList.remove("vt-theme"));
  };

  /* -------------------------------------------------------------------
     2. SCROLL PROGRESS + SMART HEADER (hides going down, returns going up)
     ------------------------------------------------------------------- */
  const header = $("#header");
  const bar = document.createElement("div");
  bar.className = "sprog"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  let lastY = scrollY, ticking = false;
  const pinActive = () => ScrollTrigger.getAll().some(st => st.pin && st.isActive);
  const menuOpen = () => $("#navMenu")?.classList.contains("is-open") || !!$(".has-drop.is-open") || !!header?.matches(":hover, :focus-within");
  const update = () => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (header) {
      const dy = y - lastY;
      if (y < 160 || menuOpen() || pinActive()) header.classList.remove("is-hidden");
      else if (dy > 6) header.classList.add("is-hidden");
      else if (dy < -6) header.classList.remove("is-hidden");
    }
    if (Math.abs(y - lastY) > 6 || y < 160) lastY = y;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  /* -------------------------------------------------------------------
     3. HEADINGS — words rise out of a mask, line by line;
        the red <em> gets an underline drawn once the words land
     ------------------------------------------------------------------- */
  const splitWords = el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        if (!n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(p)); return; }
          const o = document.createElement("span"), i = document.createElement("span");
          o.className = "mw"; i.className = "mw__i"; i.textContent = p; o.append(i); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
    });
    walk(el);
    return $$(".mw__i", el);
  };

  const titles = $$(".sec-title, .phero__title").filter(t => !t.closest("#galleryTrack"));
  titles.forEach(t => {
    if (reduceMotion) { t.classList.add("is-drawn"); return; }
    const words = splitWords(t);
    if (!words.length) return;
    // group words by rendered line so each line lifts together
    const lineOf = new Map(); let tops = [];
    words.forEach(w => { const top = Math.round(w.parentElement.offsetTop); if (!tops.includes(top)) tops.push(top); lineOf.set(w, top); });
    tops.sort((a, b) => a - b);
    gsap.set(words, { yPercent: 115 });
    const isHero = t.classList.contains("phero__title");
    const play = () => {
      const seen = {};
      words.forEach(w => {
        const li = tops.indexOf(lineOf.get(w)); seen[li] = (seen[li] || 0) + 1;
        gsap.to(w, { yPercent: 0, duration: 1.2, ease: EASE, delay: (isHero ? .25 : 0) + li * .12 + seen[li] * .03, clearProps: "transform" });
      });
      gsap.delayedCall((isHero ? .25 : 0) + tops.length * .12 + .45, () => t.classList.add("is-drawn"));
    };
    if (isHero) play();
    else ScrollTrigger.create({ trigger: t, start: "top 88%", once: true, onEnter: play });
  });

  /* -------------------------------------------------------------------
     4. IMAGES — a bottom-up wipe with a slow zoom settle
     ------------------------------------------------------------------- */
  if (!reduceMotion) {
    const imgs = $$(".person__photo img, .pimg img, .feat > img, .lm > img, .ncard > img, .vcard > img, .gal__item > img")
      .filter(i => !i.closest("#galleryTrack, .drop, .header"));
    imgs.forEach(img => {
      gsap.set(img, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.18 });
      ScrollTrigger.create({
        trigger: img.parentElement, start: "top 90%", once: true,
        onEnter: () => {
          gsap.to(img, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" });
          gsap.to(img, { scale: 1, duration: 1.9, ease: EASE, clearProps: "transform,clipPath" });
        },
      });
    });
  }

  ScrollTrigger.refresh();
})();
