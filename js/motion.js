/* =====================================================================
   ANWAR CEMENT — motion.js  (shared motion layer, loaded after main.js / page.js)
   Scroll progress, smart header, heading line reveals, image wipes,
   circular theme reveal, odometer digits, button label roll, card tilt,
   footer wordmark, product bag scroll.
   Page-to-page transitions live in CSS (@view-transition).
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

  const titles = $$(".sec-title, .phero__title, .footer__title").filter(t => !t.closest("#galleryTrack"));
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

  /* -------------------------------------------------------------------
     5. ODOMETER — digits roll into place like a mechanical counter.
     Used by the hero stats, page stats and the calculator result.
     ------------------------------------------------------------------- */
  window.AC_odometer = (el, value, { duration = 1.8, format = v => Math.round(v).toLocaleString("en-US") } = {}) => {
    const str = format(value);
    if (reduceMotion) { el.textContent = str; return; }
    el.setAttribute("aria-label", str);
    const shape = str.replace(/\d/g, "0");
    if (!el._odo || el._odo.shape !== shape) {
      el.textContent = ""; el.classList.add("odo");
      const cols = [];
      [...str].forEach(ch => {
        const span = document.createElement("span"); span.setAttribute("aria-hidden", "true");
        if (/\d/.test(ch)) {
          span.className = "odo__d";
          const reel = document.createElement("span"); reel.className = "odo__s";
          reel.innerHTML = "01234567890123456789".split("").map(n => `<span>${n}</span>`).join("");
          span.append(reel); cols.push(reel);
        } else { span.className = "odo__c"; span.textContent = ch; }
        el.append(span);
      });
      el._odo = { shape, cols };
    }
    const digits = str.replace(/\D/g, "");
    el._odo.cols.forEach((reel, i) => gsap.to(reel, {
      yPercent: -(10 + +digits[i]) * 5, overwrite: true,
      duration: duration + (digits.length - 1 - i) * .15, ease: "expo.out",
    }));
  };

  /* -------------------------------------------------------------------
     6. BUTTONS — label rolls up and a copy rises from below on hover
     ------------------------------------------------------------------- */
  const wrapRoll = l => { if (!l.firstElementChild?.classList.contains("roll")) l.innerHTML = `<span class="roll">${l.innerHTML}</span>`; };
  const rollObs = new MutationObserver(ms => ms.forEach(m => wrapRoll(m.target)));   // language switch rewrites labels
  const armRolls = () => $$(".btn .btn__label").forEach(l => { if (l._roll) return; l._roll = 1; wrapRoll(l); rollObs.observe(l, { childList: true }); });
  armRolls();
  new MutationObserver(armRolls).observe(document.body, { childList: true, subtree: true });   // buttons rendered later (dealer list)

  /* -------------------------------------------------------------------
     7. CARDS — gentle 3D tilt toward the pointer + a soft spotlight
     ------------------------------------------------------------------- */
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (finePointer && !reduceMotion) {
    $$(".icard, .person, .ncard, .lm, .vcard").forEach(card => {
      card.classList.add("tilt");
      const spot = document.createElement("i"); spot.className = "spot"; spot.setAttribute("aria-hidden", "true"); card.appendChild(spot);
      let max = 4;
      card.addEventListener("pointerenter", () => { max = card.offsetWidth > 700 ? 1.5 : 4; });   // wide cards barely tilt
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        card.style.setProperty("--ry", ((px - .5) * 2 * max).toFixed(2) + "deg"); card.style.setProperty("--rx", ((.5 - py) * 2 * max).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });

    /* product bags lean toward the pointer (product pages + home showcase) */
    [[".phero--product", ".phero__bag"], [".stage", ".stage__bags"]].forEach(([areaSel, bagSel]) => {
      const area = $(areaSel), bag = area && $(bagSel, area); if (!bag) return;
      bag.classList.add("bag-lean");
      area.addEventListener("pointermove", e => {
        const r = area.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        bag.style.setProperty("--ry", (px * 14).toFixed(2) + "deg"); bag.style.setProperty("--rx", (-py * 8).toFixed(2) + "deg");
      });
      area.addEventListener("pointerleave", () => { bag.style.setProperty("--rx", "0deg"); bag.style.setProperty("--ry", "0deg"); });
    });
  }

  /* -------------------------------------------------------------------
     8. FOOTER WORDMARK — a full-width ANWAR CEMENT that builds letter by
        letter as the page reaches its end; letters lift on hover
     ------------------------------------------------------------------- */
  const footBottom = $(".footer__bottom");
  if (footBottom) {
    const mark = document.createElement("div");
    mark.className = "footer__mark"; mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = [..."ANWAR CEMENT"].map(ch => ch === " " ? `<span class="fm__gap"></span>` : `<span class="fm__l"><span>${ch}</span></span>`).join("");
    footBottom.before(mark);
    const fit = () => { mark.style.fontSize = "100px"; mark.style.fontSize = (100 * mark.parentElement.clientWidth / mark.scrollWidth).toFixed(2) + "px"; };
    fit(); addEventListener("resize", fit);
    document.fonts && document.fonts.ready.then(() => { fit(); ScrollTrigger.refresh(); });
    const letters = $$(".fm__l > span", mark);
    if (!reduceMotion) {
      gsap.fromTo(letters, { yPercent: 105 }, {
        yPercent: 0, ease: "none", stagger: { each: .08, from: "start" },
        scrollTrigger: { trigger: mark, start: "top bottom", end: "bottom bottom", scrub: .6 },
      });
    }
  }

  /* -------------------------------------------------------------------
     9. PRODUCT HERO — the bag drifts up and turns as you scroll away
     ------------------------------------------------------------------- */
  const pBag = $(".phero--product .phero__bag");
  if (pBag && !reduceMotion) {
    ScrollTrigger.create({
      trigger: ".phero--product", start: "top top", end: "bottom top", scrub: true,
      onUpdate: self => { pBag.style.setProperty("--sy", (-self.progress * 90).toFixed(1) + "px"); pBag.style.setProperty("--sr", (self.progress * -8).toFixed(2) + "deg"); },
    });
  }

  ScrollTrigger.refresh();
})();
