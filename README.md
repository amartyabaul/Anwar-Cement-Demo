# Anwar Cement — website

Static, dependency-free marketing site (HTML + CSS + vanilla JS, GSAP + Lenis vendored).
No build step. Upload the folder to any static host (Netlify, Vercel, cPanel, S3, GitHub Pages).

## Structure
```
index.html          single page (all sections)
config.js           EDIT BEFORE LAUNCH: WhatsApp number, hotline, form endpoint, GA4 id
css/style.css       design system + all sections
js/main.js          all behaviour (sections numbered 0–22 in comments)
js/vendor/          gsap, ScrollTrigger, lenis (self-hosted)
assets/video/       hero-N.mp4 (1080p) + hero-N-720.mp4 (mobile)
assets/img/         logo, products (webp), decor, icons (favicons + og-image)
site.webmanifest, robots.txt, sitemap.xml
```

## Before going live
1. `config.js` — set `WHATSAPP`, `HOTLINE`, and `FORM_ENDPOINT`.
   - Formspree: create a form, paste `https://formspree.io/f/XXXX`. Submissions arrive as JSON with `type: "quotation" | "newsletter"`.
   - Google Sheets: deploy an Apps Script web app that appends `JSON.parse(e.postData.contents)` to a sheet and returns 200.
2. Replace placeholder content: hero stats, product spec numbers, chart data, landmark facts, dealer list (`DEALERS` in main.js), depots (`PLACES`), testimonials (`VOICES`), news cards, certifications.
3. Update `https://www.anwarcement.com/` in `index.html` (canonical, og:url, JSON-LD) and `sitemap.xml` if the domain differs.
4. Optional: replace the hand-simplified Bangladesh outline (`BD` array in main.js) with a GeoJSON-derived one.
5. Optional: re-encode hero videos with ffmpeg (`-crf 28`) for ~3 MB each.

## Dev helpers (URL params)
`?nointro` skips the preloader · `?menu=1` opens the mobile menu · `?drop=N` opens the Nth dropdown

## Local preview
```
python3 -m http.server 8765   # then open http://localhost:8765
```

## Languages
EN/বাংলা toggle in the header and footer. Strings live in the `I18N` map in `js/main.js`; add `data-i18n="key"` to any element to translate it.
