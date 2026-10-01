#!/usr/bin/env python3
"""Generate the Company sub-pages from index.html's header/footer + the content below.
Run from the project root after editing the header, footer or this file:
    python3 tools/build-pages.py
The generated *.html files are committed, so no build step is needed to deploy."""
import re, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://anwar-cement-website.vercel.app/"
idx = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()

def between(s, a, b):
    i = s.index(a); j = s.index(b, i) + len(b); return s[i:j]

header = between(idx, '  <header class="header"', "</header>")
footer = between(idx, '  <footer class="footer"', "</footer>")
fab    = between(idx, '  <!-- floating WhatsApp -->', "</a>")
cursor = '  <div class="cursor" id="cursor"><span class="cursor__dot"></span><span class="cursor__label"></span></div>'
lightbox = between(idx, '  <div class="lb" id="lb"', "</div>\n  </div>")

def relink(html):
    # in-page anchors on index become index.html#anchor on sub-pages
    html = re.sub(r'href="#(?!"|\s)([\w-]+)"', r'href="index.html#\1"', html)
    return html

header = relink(header); footer = relink(footer)
# no scroll-spy on subpages; "Home" is not active
header = header.replace('class="nav__link is-active" href="index.html#hero"', 'class="nav__link" href="index.html#hero"')

ARROW = '<span class="btn__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>'
I = {  # small inline icons
 "shield": '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
 "leaf": '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19c3-4 6-7 10-9"/></svg>',
 "people": '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5c3 0 6 2 6 5.5"/></svg>',
 "spark": '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
 "factory": '<svg viewBox="0 0 24 24"><path d="M3 21V10l6 4v-4l6 4v-4l6 4v7z"/><path d="M6 21v-4M12 21v-4M18 21v-4"/></svg>',
 "gear": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 "flask": '<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/></svg>',
 "truck": '<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
 "drop": '<svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
 "sun": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 "heart": '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg>',
 "award": '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/></svg>',
}
def icard(icon, title, text, num=None):
    n = f'<span class="icard__num">{num}</span>' if num else ""
    return f'<div class="icard">{n}<span class="icard__icon">{I[icon]}</span><h3>{title}</h3><p>{text}</p></div>'
def cta(title, text):
    return f'''  <section class="pcta"><div class="container"><div class="pcta__box" data-reveal>
      <div><h2>{title}</h2><p>{text}</p></div>
      <div class="pcta__actions"><a class="btn btn--primary btn--magnetic" href="index.html#quote"><span class="btn__label" data-i18n="cta.quote">Get a Quotation</span>{ARROW}</a><a class="btn btn--ghost" href="index.html#dealers"><span class="btn__label">Find a dealer</span></a></div>
    </div></div></section>'''

# Leadership photos: drop a file at assets/img/people/<slug>.jpg (or .png/.webp), re-run this script.
def photo(slug):
    for ext in ("jpg", "jpeg", "png", "webp"):
        if os.path.exists(os.path.join(ROOT, "assets/img/people", f"{slug}.{ext}")): return f"assets/img/people/{slug}.{ext}"
    return "assets/img/people/placeholder.svg"
def person(slug, name, role, bio, wide=False):
    src = photo(slug); ph = ' is-placeholder' if src.endswith("placeholder.svg") else ''
    return f'<div class="person{" person--wide" if wide else ""}"><figure class="person__photo{ph}"><img src="{src}" alt="{name}" loading="lazy" decoding="async"></figure><div><h3>{name}</h3><div class="person__role">{role}</div><p{" style=margin-top:10px" if wide else ""}>{bio}</p></div></div>'

PAGES = [
 dict(slug="about", nav="About Anwar Cement", title="Built on a legacy.<br>Made for <em>tomorrow.</em>", eyebrow="About Anwar Cement",
  desc="The story, values and people behind Anwar Cement Limited, a concern of Anwar Group of Industries.",
  lead="Anwar Cement Limited is a concern of Anwar Group of Industries, one of the oldest business houses of Bangladesh. We make Portland Composite Cement that engineers specify, contractors trust and families build their homes on.",
  bg="assets/img/decor/background.webp", stats=[("24+","Years of cement"),("3","Brands"),("64","Districts served")],
  prev=("Anwar Group","anwar-group.html"), next=("Leadership","leadership.html"),
  body=lambda: f'''
  <section class="psec"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Our story</span>
      <p class="lead" style="margin-top:14px">From a river-side plant on the Meghna to the skyline of Dhaka, Anwar Cement has grown with the country it serves.</p>
      <p>Anwar Cement was founded to bring a consistent, laboratory-verified cement to a market that was growing faster than its infrastructure. Backed by the manufacturing discipline of Anwar Group, the company invested early in European grinding technology and an in-house testing laboratory, a combination that remains the core of the brand today.</p>
      <p>Our three brands cover every stage of construction. <strong>Anwar Cement Special</strong> is the flagship AM grade for structural work, <strong>Shoktiman Cement</strong> brings sulphate resistance to coastal and waterlogged sites, and <strong>Lion Cement</strong> gives home builders reliable strength at an honest price.</p>
      <p>Today the network reaches all 64 districts through nine depots and more than 1,200 authorised dealers, supported by river and road fleets that dispatch from the plant every day.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>At a glance</h4>
      <ul class="facts">
        <li><span>Company</span><b>Anwar Cement Limited</b></li>
        <li><span>Parent</span><b>Anwar Group of Industries</b></li>
        <li><span>Plant</span><b>Gazaria, Munshiganj</b></li>
        <li><span>Head office</span><b>27 Dilkusha C/A, Dhaka</b></li>
        <li><span>Product</span><b>Portland Composite Cement</b></li>
        <li><span>Standard</span><b>BDS EN 197-1:2015</b></li>
        <li><span>Brands</span><b>Special · Shoktiman · Lion</b></li>
        <li><span>Certifications</span><b>BSTI · ISO 9001 · ISO 14001</b></li>
      </ul>
    </aside>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>What we stand for</span><h2 class="sec-title">Four values in<br>every <em>bag.</em></h2></div><p class="sec-lead">They are not slogans. They are the reasons a batch ships or does not.</p></div>
    <div class="grid4" data-stagger>
      {icard("shield","Uncompromising quality","Six tests on every production lot, around the clock. Nothing leaves the plant without a certificate.","01")}
      {icard("people","Partnership","Dealers, engineers and masons are partners, not customers. We train, we support, we show up on site.","02")}
      {icard("spark","Innovation","Vertical Roller Mill grinding, computer-controlled blending and a digital toolkit for builders.","03")}
      {icard("leaf","Responsibility","Lower clinker factor, cleaner energy and a CSR programme rooted in the communities we work in.","04")}
    </div>
  </div></section>

  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Our brands</span><h2 class="sec-title">Three brands.<br>One <em>standard.</em></h2></div><a class="link-arrow" href="index.html#products">Compare all three</a></div>
    <div class="grid3" data-stagger>
      <a class="icard" href="product-anwar-special.html"><img src="assets/img/products/anwar-special-white.webp" alt="" style="height:180px;object-fit:contain;margin:0 auto 6px"><h3>Anwar Cement Special</h3><p>AM Grade flagship. CEM II/A-M (V-L) 42.5N for foundations, columns, bridges and mass concrete.</p></a>
      <a class="icard" href="product-shoktiman.html"><img src="assets/img/products/shoktiman-white.webp" alt="" style="height:180px;object-fit:contain;margin:0 auto 6px"><h3>Shoktiman Cement</h3><p>Sulphate-resisting PCC for coastal and saline ground, basements, roof slabs and water tanks.</p></a>
      <a class="icard" href="product-lion.html"><img src="assets/img/products/lion-white.webp" alt="" style="height:180px;object-fit:contain;margin:0 auto 6px"><h3>Lion Cement</h3><p>Reliable strength for plaster, brickwork, flooring and residential slabs at an honest price.</p></a>
    </div>
  </div></section>
  {cta("Want the full company profile?","Download our corporate brochure or talk to our team about partnerships, supply and site support.")}'''),

 dict(slug="leadership", nav="Leadership", title="The people who<br><em>set the standard.</em>", eyebrow="Leadership",
  desc="Board of directors and management team of Anwar Cement Limited.",
  lead="A board with three generations of industrial experience, and a management team that runs the plant, the laboratory and the network every single day.",
  bg="assets/img/decor/city-center.webp", stats=[("1834","Group founded"),("18","Group concerns"),("14,000+","People")],
  prev=("About","about.html"), next=("Milestones","milestones.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Board of directors</span><h2 class="sec-title">Guided by<br><em>experience.</em></h2></div><p class="sec-lead">The leadership of Anwar Group of Industries, the parent of Anwar Cement Limited, as published by the group.</p></div>
    <div class="people" data-stagger>
      {person("manwar-hossain","Manwar Hossain","Chairman, Anwar Group of Industries · Managing Director, Anwar Cement Ltd.","Leads Anwar Group of Industries and its Building Materials Division. Educated at St Paul's School, Darjeeling, he completed his MBA at the University of New Hampshire in 1992 and joined the family business in 1993. Former Group Managing Director and Vice-Chairman of The City Bank, he was elected Chairman in September 2021, succeeding the founder, Alhaj Anwar Hossain.", wide=True)}
      {person("hossain-mehmood","Hossain Mehmood","Vice-Chairman, Anwar Group of Industries","Leads the group's Textile Division. A member of the Chartered Institute of Management Accountants, he serves on the board of the Bangladesh Textile Mills Association and as Vice President of BKMEA.")}
      {person("hossain-khaled","Hossain Khaled","Group Managing Director, Anwar Group of Industries","Leads the Real Estate, Infrastructure Construction, Jute and Automobile divisions. The youngest-ever President of the Dhaka Chamber of Commerce & Industry, elected at 33, and Vice-Chairman of The City Bank. Holds a bachelor's in Accounting and a master's in International Banking from the United States.")}
      {person("hossain-akhter","Hossain Akhtar","Executive Director, Anwar Group of Industries","Group Executive Director with decades of service across Anwar Group's manufacturing and trading concerns, including its cement operations, and previously Group Executive Director at Ford Bangladesh.")}
      {person("furkaan-hossain","Furkaan N Hossain","Deputy Managing Director · Director, Anwar Cement Ltd.","Director of Anwar Cement Ltd. and founder and Managing Director of Anwar Enterprise Systems, the group's technology company. Holds a BSc in Computer Science from Colorado State University and serves as a Director of the Dhaka Chamber of Commerce & Industry.")}
      {person("waeez-r-hossain","Waeez R Hossain","Deputy Managing Director, Anwar Group of Industries","Oversees the building materials, steel, cement, polymer, cement sheet and foundry businesses, guiding strategy, operations and digital transformation. MBA from Georgetown University's McDonough School of Business; formerly at Bain Capital; co-founder of Anwar Enterprise Systems.")}
      {person("faizah-mehmood","Faizah Mehmood","Deputy Managing Director, Anwar Group of Industries","Leads within the Textile Division. BCom from Rotman Commerce, University of Toronto, and MS from Johns Hopkins University; previously with Ernst & Young, Edotco and Incepta. Committee Member of the Bangladesh Employers' Federation and Director of BTTLMEA.")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container twocol">
    <div data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Management team</span>
      <h2 class="sec-title" style="margin-bottom:22px">Running the plant,<br>the lab and the <em>network.</em></h2>
      <ul class="mgmt">
        <li><b>Chief Operating Officer</b><span>Plant &amp; supply chain</span></li>
        <li><b>Head of Manufacturing</b><span>Gazaria plant</span></li>
        <li><b>Head of Quality Assurance</b><span>Laboratory &amp; certification</span></li>
        <li><b>Chief Financial Officer</b><span>Finance &amp; treasury</span></li>
        <li><b>Head of Sales &amp; Distribution</b><span>Depots &amp; dealers</span></li>
        <li><b>Head of Technical Services</b><span>Engineer &amp; site support</span></li>
        <li><b>Head of Marketing</b><span>Brand &amp; communications</span></li>
        <li><b>Head of Human Resources</b><span>People &amp; safety</span></li>
      </ul>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Group at a glance</h4>
      <ul class="facts">
        <li><span>Founded</span><b>1834 · Dhaka</b></li>
        <li><span>Founder Chairman</span><b>Alhaj Anwar Hossain</b></li>
        <li><span>Chairman since</span><b>14 Sep 2021</b></li>
        <li><span>Concerns</span><b>18</b></li>
        <li><span>People</span><b>~14,000</b></li>
        <li><span>Anwar Cement</span><b>Est. 2002 · Gazaria</b></li>
      </ul>
    </aside>
  </div></section>
  {cta("Talk to our technical team.","Specification support, mix design advice and site visits for engineers and contractors.")}'''),

 dict(slug="milestones", nav="Milestones", title="Two centuries of trade.<br>Two decades of <em>cement.</em>", eyebrow="Milestones",
  desc="Timeline of Anwar Group and Anwar Cement, from 1834 to today.",
  lead="Anwar Group's roots go back to 1834. Anwar Cement is one of its youngest concerns, and one of its fastest growing.",
  bg="assets/img/decor/hanif.webp", stats=[("1834","Group founded"),("2000s","Cement launched"),("64","Districts today")],
  prev=("Leadership","leadership.html"), next=("Manufacturing","manufacturing.html"),
  body=lambda: '''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Timeline</span><h2 class="sec-title">How we got<br><em>here.</em></h2></div><p class="sec-lead">Years and events below are indicative placeholders; replace with the verified corporate timeline.</p></div>
    <div class="tl"><i class="tl__line"></i>
      <div class="tli"><div class="tli__year">1834</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Anwar Group</span><h3>A trading house is born</h3><p>The family business begins in Old Dhaka, trading hides and textiles. It becomes the foundation of one of the oldest business houses in Bangladesh.</p></div></div>
      <div class="tli"><div class="tli__year">1950s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Anwar Group</span><h3>Into manufacturing</h3><p>The group moves from trade to industry with textile and jute mills, setting the pattern of long-term investment in production.</p></div></div>
      <div class="tli"><div class="tli__year">1980s–90s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Anwar Group</span><h3>Diversification</h3><p>Steel, polymer, automobiles, real estate and financial services join the portfolio as the country's economy opens up.</p></div></div>
      <div class="tli"><div class="tli__year">Early 2000s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Anwar Cement</span><h3>Anwar Cement Limited founded</h3><p>A cement grinding plant is established at Gazaria on the Meghna, chosen for river access to imported clinker and nationwide dispatch.</p></div></div>
      <div class="tli"><div class="tli__year">Mid 2000s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Brands</span><h3>Three brands, one standard</h3><p>Anwar Cement Special, Shoktiman Cement and Lion Cement are launched to serve structural, coastal and residential construction.</p></div></div>
      <div class="tli"><div class="tli__year">2010s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Quality</span><h3>In-house laboratory and ISO 9001</h3><p>A full testing laboratory is commissioned; every production lot is tested and certified before dispatch.</p></div></div>
      <div class="tli"><div class="tli__year">2010s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Projects</span><h3>Landmark supply</h3><p>Anwar Cement is poured into national infrastructure including flyovers, hospitals, ports and power projects.</p></div></div>
      <div class="tli"><div class="tli__year">2020s</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Technology</span><h3>Vertical Roller Mill upgrade</h3><p>European VRM grinding replaces ball milling, cutting energy per tonne and improving fineness and consistency.</p></div></div>
      <div class="tli"><div class="tli__year">2026</div><i class="tli__dot"></i><div class="tli__card"><span class="tli__tag">Capacity</span><h3>New silo and digital tools</h3><p>A 60,000-tonne silo lifts storage capacity, and builders get an online calculator, dealer locator and instant quotations.</p></div></div>
    </div>
  </div></section>''' + cta("The next milestone could be your project.","Tell us what you are building and we will match the right brand, quantity and delivery plan.")),

 dict(slug="manufacturing", nav="Manufacturing", title="One plant.<br>Zero <em>shortcuts.</em>", eyebrow="Manufacturing",
  desc="Inside the Anwar Cement plant at Gazaria: capacity, Vertical Roller Mill technology, laboratory and logistics.",
  lead="Our grinding plant sits on the bank of the Meghna at Gazaria, Munshiganj, with a river jetty for clinker import and road and river fleets for dispatch to every district.",
  bg="assets/img/decor/banner-2.webp", stats=[("VRM","Grinding technology"),("24/7","Laboratory"),("60k t","Silo capacity")],
  prev=("Milestones","milestones.html"), next=("Sustainability","sustainability.html"),
  body=lambda: f'''
  <section class="psec"><div class="container twocol">
    <div data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>The plant</span>
      <h2 class="sec-title" style="margin-bottom:22px">Gazaria,<br><em>Munshiganj.</em></h2>
      <div class="prose"><p>Clinker, fly ash, slag and gypsum arrive by river and are stored in covered sheds. Computer-controlled feeders dose each material to the exact CEM II/A-M recipe before grinding in a Vertical Roller Mill, which produces a finer, more uniform cement with less energy than ball milling.</p><p>Finished cement is homogenised in silos, sampled every two hours by the laboratory, and packed by automatic rotary packers into 50 kg bags with moisture-proof liners. Bulk tankers serve ready-mix and large projects directly.</p></div>
      <div class="pimg pimg--wide" style="margin-top:28px"><img src="assets/img/decor/banner-1.webp" alt="Cement silo at the Gazaria plant" loading="lazy"></div>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Plant specifications</h4>
      <table class="spec">
        <tr><th>Location</th><td><b>Gazaria, Munshiganj</b><br>On the Meghna river</td></tr>
        <tr><th>Process</th><td>Clinker grinding &amp; blending</td></tr>
        <tr><th>Mill</th><td><b>Vertical Roller Mill</b> (European)</td></tr>
        <tr><th>Products</th><td>CEM II/A-M (V-L) 42.5N · SR variant</td></tr>
        <tr><th>Fineness</th><td>~3,400 cm²/g Blaine (typical)</td></tr>
        <tr><th>Storage</th><td>60,000 t silo (2026)</td></tr>
        <tr><th>Packing</th><td>Rotary packers · 50 kg bags · bulk</td></tr>
        <tr><th>Logistics</th><td>River jetty · road &amp; river fleets · 9 depots</td></tr>
        <tr><th>Certification</th><td>BSTI · ISO 9001 · ISO 14001</td></tr>
      </table>
      <p style="font-size:12px;color:var(--steel);margin-top:12px">Capacity figures are placeholders pending confirmation.</p>
    </aside>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Technology</span><h2 class="sec-title">Engineered for<br><em>consistency.</em></h2></div><a class="link-arrow" href="index.html#why">See the five-step process</a></div>
    <div class="grid4" data-stagger>
      {icard("factory","Vertical Roller Mill","Grinds finer and more evenly than ball mills, with up to 30% less electricity per tonne.")}
      {icard("gear","Computer-controlled blending","Additives dosed to ±0.5% so the first and the ten-thousandth bag are identical.")}
      {icard("flask","In-house laboratory","Fineness, setting time, soundness and compressive strength tested on every lot, 24/7.")}
      {icard("truck","River and road logistics","Own jetty for clinker import; dispatch by barge and truck to nine depots and 64 districts.")}
    </div>
  </div></section>

  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Quality assurance</span><h2 class="sec-title">Tested, then<br><em>tested again.</em></h2></div><p class="sec-lead">Every batch carries a test certificate. Consultants can request lot-wise results at any time.</p></div>
    <div class="metrics" data-stagger>
      <div class="metric"><b><span data-count="6">0</span></b><span>tests on every production lot</span></div>
      <div class="metric"><b><span data-count="2">0</span>h</b><span>sampling interval, around the clock</span></div>
      <div class="metric"><b><span data-count="52.5">0</span></b><span>MPa typical 28-day strength (Special)</span></div>
      <div class="metric"><b><span data-count="100">0</span>%</b><span>clinker shipments lab-cleared on arrival</span></div>
    </div>
  </div></section>
  {cta("Visit the plant.","Engineers, consultants and institutional buyers are welcome. Book a plant visit or request lot-wise test results.")}'''),

 dict(slug="sustainability", nav="Sustainability", title="Stronger buildings.<br>Lighter <em>footprint.</em>", eyebrow="Sustainability",
  desc="Anwar Cement's environmental commitments, green cement, energy, water and community programmes.",
  lead="Portland Composite Cement is already a lower-carbon cement. We are pushing further: cleaner energy at the plant, less water, less waste, and a CSR programme in the communities around Gazaria.",
  bg="assets/img/decor/payra-port.webp", stats=[("PCC","Lower clinker factor"),("ISO 14001","Environmental"),("64","Districts reached")],
  prev=("Manufacturing","manufacturing.html"), next=("Anwar Group","anwar-group.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Four pillars</span><h2 class="sec-title">Where we put<br>the <em>effort.</em></h2></div><p class="sec-lead">Targets and figures are indicative placeholders until the sustainability report is finalised.</p></div>
    <div class="grid4" data-stagger>
      {icard("leaf","Green cement","Composite cement replaces part of the clinker with fly ash, slag and limestone, cutting CO₂ per tonne versus ordinary Portland cement.","01")}
      {icard("sun","Energy","Vertical Roller Mill grinding, high-efficiency motors and a solar programme on plant rooftops reduce grid electricity per tonne.","02")}
      {icard("drop","Water &amp; waste","Closed-loop process water, dust collection at every transfer point and zero process waste to landfill.","03")}
      {icard("heart","Community","Schools, clean-water points and mason training in the villages around Gazaria and along our supply routes.","04")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Green cement</span>
      <p class="lead" style="margin-top:14px">Every bag of Anwar Cement is a composite cement. That single choice removes more carbon than any other lever available to a cement maker today.</p>
      <p>Clinker is the carbon-intensive part of cement. By blending it with supplementary materials such as fly ash and slag, industrial by-products that would otherwise be waste, we lower the clinker factor while improving durability and long-term strength.</p>
      <p>We report our environmental performance under ISO 14001 and publish the key indicators below annually.</p>
    </div>
    <div data-reveal>
      <div class="metrics" style="grid-template-columns:1fr 1fr">
        <div class="metric"><b><span data-count="25">0</span>%</b><span>lower CO₂ per tonne vs OPC (indicative)</span></div>
        <div class="metric"><b><span data-count="30">0</span>%</b><span>less electricity per tonne after VRM upgrade</span></div>
        <div class="metric"><b><span data-count="100">0</span>%</b><span>process water recycled</span></div>
        <div class="metric"><b><span data-count="0">0</span></b><span>process waste to landfill</span></div>
      </div>
    </div>
  </div></section>

  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>CSR</span><h2 class="sec-title">Building people,<br>not just <em>buildings.</em></h2></div></div>
    <div class="grid3" data-stagger>
      {icard("people","Mason training","Hands-on courses on mix ratios, curing and safe handling, with certificates for graduates and their contractors.")}
      {icard("award","Scholarships","Support for engineering and technical students from the districts around the plant.")}
      {icard("drop","Clean water","Tube wells and filtration points in riverside communities near Gazaria.")}
    </div>
  </div></section>
  {cta("Read the sustainability report.","Our annual report covers emissions, energy, water, safety and community investment.")}'''),

 dict(slug="anwar-group", nav="Anwar Group", title="One of the oldest<br>business houses of <em>Bangladesh.</em>", eyebrow="Anwar Group of Industries",
  desc="Anwar Group of Industries: history, sectors and concerns, the parent of Anwar Cement Limited.",
  lead="Founded in 1834, Anwar Group of Industries has grown from a trading house in Old Dhaka into a diversified conglomerate spanning textiles, cement, steel, polymer, real estate, automobiles and financial services.",
  bg="assets/img/decor/bsmmu.webp", stats=[("1834","Founded"),("18","Concerns"),("14k","People")],
  prev=("Sustainability","sustainability.html"), next=("About","about.html"),
  body=lambda: '''
  <section class="psec"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>The group</span>
      <p class="lead" style="margin-top:14px">Nearly two centuries of doing business in Bangladesh, and a portfolio built around things the country needs: cloth, cement, steel, homes and finance.</p>
      <p>Anwar Group's approach has stayed consistent across generations: invest in production, own the quality, and build for the long term. Anwar Cement applies that same discipline to cement, with the group's engineering, logistics and financial strength behind it.</p>
      <p>Anwar Cement Limited was established in 2002 with a clinker grinding plant on the Meghna at Gazaria, and has since supplied national landmarks from the Mayor Hanif Flyover to the Rooppur Nuclear Power Plant.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Group facts</h4>
      <ul class="facts">
        <li><span>Founded</span><b>1834, Dhaka</b></li>
        <li><span>Headquarters</span><b>Baitul Hossain Building, Dilkusha</b></li>
        <li><span>Sectors</span><b>8</b></li>
        <li><span>Concerns</span><b>18</b></li>
        <li><span>Employees</span><b>~14,000</b></li>
        <li><span>Website</span><b><a href="#" data-soon>anwargroup.com</a></b></li>
      </ul>
    </aside>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Sectors</span><h2 class="sec-title">What the group<br><em>makes.</em></h2></div></div>
    <div class="grid4" data-stagger>
      <div class="sector"><span class="sector__yr">Since 1834</span><h3>Textiles &amp; Jute</h3><p>Spinning, weaving and jute mills, the group's original industrial base.</p></div>
      <div class="sector is-here"><span class="sector__yr">Cement</span><h3>Anwar Cement</h3><p>Portland Composite Cement from Gazaria. You are here.</p></div>
      <div class="sector"><span class="sector__yr">Steel</span><h3>Anwar Ispat</h3><p>Reinforcing steel and structural products for construction.</p></div>
      <div class="sector"><span class="sector__yr">Polymer</span><h3>Pipes &amp; Fittings</h3><p>uPVC pipes and fittings for water and construction.</p></div>
      <div class="sector"><span class="sector__yr">Real estate</span><h3>Anwar Landmark</h3><p>Residential and commercial developments in Dhaka.</p></div>
      <div class="sector"><span class="sector__yr">Automobiles</span><h3>Anwar Automobiles</h3><p>Vehicle distribution and after-sales service.</p></div>
      <div class="sector"><span class="sector__yr">Finance</span><h3>Financial services</h3><p>Banking, insurance and securities interests.</p></div>
      <div class="sector"><span class="sector__yr">Consumer</span><h3>Bags &amp; consumer goods</h3><p>Packaging and everyday consumer products.</p></div>
    </div>
  </div></section>''' + cta("Building with the strength of a group.","Institutional buyers and developers can draw on group logistics, steel and finance alongside cement.")),
]

PRODUCTS = [
 dict(slug="product-anwar-special", nav="Anwar Cement Special", img="assets/img/products/anwar-special.webp", tag="AM Grade · Flagship",
  title="Anwar Cement<br><em>Special.</em>", desc="Anwar Cement Special: Portland Composite Cement CEM II/A-M (V-L) 42.5N, our flagship AM grade for structural concrete.",
  lead="Our flagship AM grade for structural work. Fly ash, slag and limestone blended for a dense, low-permeability concrete that keeps gaining strength long after 28 days.",
  chips=["CEM II/A-M (V-L)","42.5N","BDS EN 197-1:2015","50 kg bag · Bulk"], bg="assets/img/decor/nuclear-power-plant.webp",
  meters=[("28-day compressive strength","52.5 MPa",88),("Early strength (2-day)","22 MPa",74),("Initial setting time","≥ 120 min",60),("Durability index","96%",96)],
  spec=[("Cement type","Portland Composite Cement (PCC)"),("Classification","CEM II/A-M (V-L) 42.5N"),("Standard","BDS EN 197-1:2015 · BSTI certified"),("Clinker content","80–94%"),("Additives","Fly ash (V), limestone (L), gypsum"),("Fineness (Blaine)","≥ 3,400 cm²/g (typical)"),("Initial / final setting","≥ 120 min / ≤ 375 min"),("Soundness (Le Chatelier)","≤ 10 mm"),("2-day strength","≥ 20 MPa"),("28-day strength","≥ 42.5 MPa (typical 52.5)"),("Sulphate resistance","Moderate"),("Packaging","50 kg woven bag with liner · bulk tanker")],
  uses=[("Foundations & piling","High early and long-term strength for load-bearing work."),("Columns & beams","Consistent 42.5N strength for RCC framing."),("Bridges & flyovers","Specified on national infrastructure projects."),("Mass concrete","Composite blend keeps heat of hydration low."),("High-rise slabs","Reliable strength gain for fast formwork cycles."),("Precast","Uniform fineness for smooth, dense precast elements."),("Water-retaining structures","Low permeability for tanks and basements."),("Ready-mix","Consistent workability batch after batch.")],
  mixes=[("M15 · 1 : 2 : 4","Plain concrete, floors","~6.3 bags/m³"),("M20 · 1 : 1.5 : 3","Slabs, beams, columns","~8.0 bags/m³"),("M25 · 1 : 1 : 2","Structural, foundations","~11.0 bags/m³")],
  calc="slab", others=["product-shoktiman","product-lion"], prev=("Lion Cement","product-lion.html"), next=("Shoktiman Cement","product-shoktiman.html")),
 dict(slug="product-shoktiman", nav="Shoktiman Cement", img="assets/img/products/shoktiman.webp", tag="Sulphate Resisting",
  title="Shoktiman<br><em>Cement.</em>", desc="Shoktiman Cement: sulphate-resisting Portland Composite Cement CEM II/A-M 42.5N SR for coastal, saline and waterlogged sites.",
  lead="Built for the toughest ground. Sulphate-resisting chemistry protects foundations and basements in coastal, saline and waterlogged soil, while a fine grind gives a smooth, crack-resistant finish.",
  chips=["CEM II/A-M (V-L)","42.5N · SR","BDS EN 197-1:2015","50 kg bag"], bg="assets/img/decor/payra-port.webp",
  meters=[("28-day compressive strength","48 MPa",80),("Early strength (2-day)","20 MPa",68),("Initial setting time","≥ 110 min",55),("Sulphate resistance","98%",98)],
  spec=[("Cement type","Portland Composite Cement (PCC)"),("Classification","CEM II/A-M (V-L) 42.5N · Sulphate Resisting"),("Standard","BDS EN 197-1:2015 · BSTI certified"),("Clinker content","80–94% (low C₃A clinker)"),("Additives","Fly ash (V), limestone (L), gypsum"),("Fineness (Blaine)","≥ 3,500 cm²/g (typical)"),("Initial / final setting","≥ 110 min / ≤ 375 min"),("Soundness (Le Chatelier)","≤ 10 mm"),("2-day strength","≥ 18 MPa"),("28-day strength","≥ 42.5 MPa (typical 48)"),("Sulphate resistance","High (SR)"),("Packaging","50 kg woven bag with liner")],
  uses=[("Coastal & saline soil","Resists sulphate attack from sea water and saline groundwater."),("Basements","Low permeability where groundwater is aggressive."),("Roof slabs","Fine grind gives a dense, crack-resistant slab."),("Water tanks","Durable in constant contact with water."),("Sewage & drainage","Protection in sulphate-rich effluent."),("Piling in soft ground","Long-term durability below the water table."),("Marine structures","Jetties, embankments and port works."),("Industrial floors","Chemical resistance for plants and warehouses.")],
  mixes=[("M15 · 1 : 2 : 4","Plain concrete, floors","~6.3 bags/m³"),("M20 · 1 : 1.5 : 3","Slabs, beams, columns","~8.0 bags/m³"),("M25 · 1 : 1 : 2","Foundations in aggressive soil","~11.0 bags/m³")],
  calc="floor", others=["product-anwar-special","product-lion"], prev=("Anwar Cement Special","product-anwar-special.html"), next=("Lion Cement","product-lion.html")),
 dict(slug="product-lion", nav="Lion Cement", img="assets/img/products/lion.webp", tag="Value · Everyday Build",
  title="Lion<br><em>Cement.</em>", desc="Lion Cement: Portland Composite Cement to BDS EN 197-1:2015 for plaster, brickwork, flooring and residential slabs.",
  lead="Reliable strength at an honest price. A workable, easy-to-finish mix for plaster, brickwork and residential slabs, so every home in Bangladesh can be built on the same quality that stands behind our landmarks.",
  chips=["CEM II/A-M","PCC","BDS EN 197-1:2015","50 kg bag"], bg="assets/img/decor/city-center.webp",
  meters=[("28-day compressive strength","45 MPa",75),("Early strength (2-day)","18 MPa",60),("Initial setting time","≥ 105 min",52),("Workability","94%",94)],
  spec=[("Cement type","Portland Composite Cement (PCC)"),("Classification","CEM II/A-M"),("Standard","BDS EN 197-1:2015 · BSTI certified"),("Clinker content","65–79%"),("Additives","Fly ash, slag, limestone, gypsum"),("Fineness (Blaine)","≥ 3,300 cm²/g (typical)"),("Initial / final setting","≥ 105 min / ≤ 375 min"),("Soundness (Le Chatelier)","≤ 10 mm"),("2-day strength","≥ 16 MPa"),("28-day strength","≥ 32.5 MPa (typical 45)"),("Sulphate resistance","Standard"),("Packaging","50 kg woven bag with liner")],
  uses=[("Plaster","Smooth, workable mortar that finishes cleanly and resists cracking."),("Brickwork","Consistent mortar strength for walls and boundary walls."),("Residential slabs","Reliable strength for home roofs and floors."),("Flooring (PCC)","Even, durable plain concrete floors."),("Rendering","Fine grind for external render and finishes."),("Tile fixing","Good bond and workability for tiling mortar."),("Small foundations","Single-storey and semi-pucca construction."),("Repairs","Everyday patching and maintenance work.")],
  mixes=[("Plaster 1 : 4 / 1 : 6","Internal / external plaster","~0.45 / 0.32 bags per m² at 12 mm"),("Brick mortar 1 : 6","10\" wall","~3 bags per 1,000 bricks"),("M15 · 1 : 2 : 4","Floors, small slabs","~6.3 bags/m³")],
  calc="plaster", others=["product-anwar-special","product-shoktiman"], prev=("Shoktiman Cement","product-shoktiman.html"), next=("Anwar Cement Special","product-anwar-special.html")),
]
PMAP = {p["slug"]: p for p in PRODUCTS}

def landmark(img, tag, title, text, m1, m2):
    return f'<article class="lm"><img src="{img}" alt="" loading="lazy"><div class="lm__body"><span class="lm__tag">{tag}</span><h3>{title}</h3><p>{text}</p><div class="lm__meta"><span><b>{m1[0]}</b>{m1[1]}</span><span><b>{m2[0]}</b>{m2[1]}</span></div></div></article>'

WHY = [
 dict(slug="quality-assurance", group="Why Anwar", nav="Quality Assurance", title="Tested every<br><em>two hours.</em>", eyebrow="Quality Assurance",
  desc="How Anwar Cement tests every production lot in its in-house laboratory: fineness, setting time, soundness and compressive strength.",
  lead="Every production lot is sampled and tested in our own laboratory before it is released. Nothing ships without a certificate, and consultants can request lot-wise results at any time.",
  bg="assets/img/decor/background.webp", stats=[("6","Tests per lot"),("2h","Sampling interval"),("100%","Lots certified")],
  prev=("Landmark Projects","landmark-projects.html"), next=("Technology","technology.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Six tests, every lot</span><h2 class="sec-title">What we check<br>before you <em>pour.</em></h2></div><p class="sec-lead">All tests follow BDS EN 196 methods and are reported against the BDS EN 197-1:2015 limits.</p></div>
    <div class="grid3" data-stagger>
      {icard("flask","Fineness (Blaine)","Specific surface area by air permeability. Finer cement hydrates faster and gives better workability. Target ≥ 3,400 cm²/g.","01")}
      {icard("gear","Setting time","Initial and final set by Vicat needle. Guarantees masons have working time and slabs stiffen on schedule.","02")}
      {icard("shield","Soundness","Le Chatelier expansion test to rule out delayed expansion from free lime or magnesia. Limit ≤ 10 mm.","03")}
      {icard("award","Compressive strength","Mortar cubes crushed at 2, 7 and 28 days. The number that proves the grade on the bag.","04")}
      {icard("drop","Chemical analysis","Loss on ignition, insoluble residue, SO₃ and chloride content, checked against EN 197-1 limits.","05")}
      {icard("truck","Clinker on arrival","Every clinker shipment is tested for lime saturation and free lime before a single tonne is unloaded.","06")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>The laboratory</span>
      <p class="lead" style="margin-top:14px">A dedicated laboratory at the Gazaria plant, staffed around the clock, with automatic samplers on every production line.</p>
      <p>Samples are drawn every two hours from the mill outlet, the silos and the packing line. Results go straight into the plant's quality system; if any parameter drifts towards a limit, the lot is held and the mill settings are corrected before it can be released.</p>
      <p>Each dispatch carries a test certificate for the lot it was drawn from. Engineers and consultants can request certificates and 28-day results for any batch number printed on the bag.</p>
      <div class="phero__cta" style="margin-top:22px"><a class="link-arrow" href="downloads.html">Sample test certificate</a><a class="link-arrow" href="index.html#why">See the strength curve</a></div>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Typical results · Anwar Cement Special</h4>
      <table class="spec">
        <tr><th>Blaine fineness</th><td><b>3,450</b> cm²/g</td></tr>
        <tr><th>Initial set</th><td><b>135</b> min (limit ≥ 60)</td></tr>
        <tr><th>Final set</th><td><b>210</b> min (limit ≤ 600)</td></tr>
        <tr><th>Soundness</th><td><b>1.0</b> mm (limit ≤ 10)</td></tr>
        <tr><th>2-day strength</th><td><b>22</b> MPa (limit ≥ 10)</td></tr>
        <tr><th>28-day strength</th><td><b>52.5</b> MPa (limit ≥ 42.5)</td></tr>
        <tr><th>SO₃</th><td><b>2.4</b>% (limit ≤ 3.5)</td></tr>
        <tr><th>Chloride</th><td><b>0.02</b>% (limit ≤ 0.10)</td></tr>
      </table>
      <p style="font-size:12px;color:var(--steel);margin-top:12px">Indicative values; replace with the latest laboratory report.</p>
    </aside>
  </div></section>

  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Beyond the plant</span><h2 class="sec-title">Quality that<br>reaches the <em>site.</em></h2></div></div>
    <div class="metrics" data-stagger>
      <div class="metric"><b><span data-count="6">0</span></b><span>tests on every production lot</span></div>
      <div class="metric"><b><span data-count="12">0</span></b><span>technical service engineers on call</span></div>
      <div class="metric"><b><span data-count="48">0</span>h</b><span>turnaround for a site cube test result</span></div>
      <div class="metric"><b><span data-count="0">0</span></b><span>lots released without a certificate</span></div>
    </div>
  </div></section>
  {cta("Need a certificate or a site test?","Send us a batch number or book a technical service visit. Our engineers support mix design and cube testing on site.")}'''),

 dict(slug="technology", group="Why Anwar", nav="Technology", title="European grinding.<br>Bangladeshi <em>strength.</em>", eyebrow="Technology",
  desc="Vertical Roller Mill grinding, computer-controlled blending and automated packing at the Anwar Cement plant.",
  lead="Vertical Roller Mill technology grinds finer and more evenly than a ball mill, with up to 30% less electricity per tonne. It is the reason our cement hydrates faster, works smoother and stays consistent bag after bag.",
  bg="assets/img/decor/banner-2.webp", stats=[("VRM","Grinding mill"),("−30%","Energy per tonne"),("±0.5%","Dosing tolerance")],
  prev=("Quality Assurance","quality-assurance.html"), next=("Certifications","certifications.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Process technology</span><h2 class="sec-title">From clinker<br>to <em>bag.</em></h2></div><a class="link-arrow" href="manufacturing.html">Visit the plant page</a></div>
    <div class="grid4" data-stagger>
      {icard("truck","Receiving & storage","Clinker and additives arrive by river at our own jetty and are stored under cover to keep moisture out.","01")}
      {icard("gear","Computer-controlled dosing","Weigh-feeders dose clinker, fly ash, slag, limestone and gypsum to the recipe within ±0.5%.","02")}
      {icard("factory","Vertical Roller Mill","Material is ground between rollers and a rotating table, with hot gas drying and a classifier that returns coarse particles.","03")}
      {icard("spark","Homogenising silos","Finished cement is blended in silos so every dispatch is uniform, then packed by automatic rotary packers.","04")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Why VRM matters</span>
      <p class="lead" style="margin-top:14px">A ball mill tumbles steel balls; a Vertical Roller Mill grinds under controlled pressure. The difference shows up in your concrete.</p>
      <p><strong>Narrower particle size distribution.</strong> Fewer over-ground fines and fewer coarse grains, so water demand drops and workability improves at the same water–cement ratio.</p>
      <p><strong>Lower energy.</strong> Grinding, drying and classifying happen in one machine, cutting electricity per tonne by up to 30% and reducing the carbon footprint of every bag.</p>
      <p><strong>Consistency.</strong> Online particle-size analysis feeds back to the classifier in real time, holding fineness within a tight band from one hour to the next.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>VRM vs ball mill</h4>
      <table class="spec">
        <tr><th>Energy per tonne</th><td><b>−25 to −30%</b></td></tr>
        <tr><th>Particle size spread</th><td><b>Narrower</b> (better workability)</td></tr>
        <tr><th>Drying</th><td>Integrated hot-gas drying</td></tr>
        <tr><th>Fineness control</th><td>Online, real-time classifier</td></tr>
        <tr><th>Noise & dust</th><td>Enclosed, bag-filtered</td></tr>
        <tr><th>Footprint</th><td>~40% smaller</td></tr>
      </table>
    </aside>
  </div></section>

  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Digital</span><h2 class="sec-title">Technology for<br><em>builders too.</em></h2></div></div>
    <div class="grid3" data-stagger>
      <a class="icard" href="calculator.html"><span class="icard__icon">{I["spark"]}</span><h3>Smart cement calculator</h3><p>Bags, sand, aggregate and cost for slabs, columns, plaster and brickwork, shareable on WhatsApp.</p></a>
      <a class="icard" href="index.html#dealers"><span class="icard__icon">{I["truck"]}</span><h3>Dealer locator</h3><p>Find the nearest authorised dealer in all 64 districts, with one-tap call and directions.</p></a>
      <a class="icard" href="index.html#quote"><span class="icard__icon">{I["shield"]}</span><h3>Instant quotation</h3><p>Three-step online request with a two-hour call-back on working days.</p></a>
    </div>
  </div></section>
  {cta("See the technology in action.","Book a plant visit or ask our technical team how VRM cement behaves in your mix design.")}'''),

 dict(slug="certifications", group="Why Anwar", nav="Certifications", title="Independently<br><em>verified.</em>", eyebrow="Certifications",
  desc="Anwar Cement certifications: BSTI, BDS EN 197-1:2015, ISO 9001 and ISO 14001.",
  lead="Our cement is certified by the Bangladesh Standards and Testing Institution and manufactured under ISO-certified quality and environmental management systems. Certificates are available to download for every brand.",
  bg="assets/img/decor/bsmmu.webp", stats=[("BSTI","Product mark"),("ISO 9001","Quality"),("ISO 14001","Environment")],
  prev=("Technology","technology.html"), next=("Landmark Projects","landmark-projects.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Our certifications</span><h2 class="sec-title">Standards we<br><em>hold.</em></h2></div><p class="sec-lead">Certificate numbers, validity dates and downloads are placeholders until the official documents are supplied.</p></div>
    <div class="grid2" data-stagger>
      <div class="icard"><span class="icard__icon">{I["award"]}</span><h3>BSTI Certification Mark</h3><p>Mandatory product certification by the Bangladesh Standards and Testing Institution for each brand, renewed on periodic factory inspection and market sampling.</p><table class="spec" style="margin-top:10px"><tr><th>Standard</th><td>BDS EN 197-1:2015</td></tr><tr><th>Brands</th><td>Special · Shoktiman · Lion</td></tr><tr><th>Valid until</th><td>To be confirmed</td></tr></table><a class="link-arrow" href="downloads.html">Download certificate</a></div>
      <div class="icard"><span class="icard__icon">{I["shield"]}</span><h3>BDS EN 197-1:2015</h3><p>The Bangladesh adoption of the European cement standard. Defines composition, strength classes (32.5 / 42.5 / 52.5) and conformity criteria for CEM II composite cements.</p><table class="spec" style="margin-top:10px"><tr><th>Classification</th><td>CEM II/A-M (V-L) 42.5N</td></tr><tr><th>Conformity</th><td>Autocontrol testing + BSTI surveillance</td></tr></table><a class="link-arrow" href="product-anwar-special.html">See product specification</a></div>
      <div class="icard"><span class="icard__icon">{I["gear"]}</span><h3>ISO 9001:2015</h3><p>Quality management system covering procurement, production, laboratory testing, dispatch and customer service at the Gazaria plant and head office.</p><table class="spec" style="margin-top:10px"><tr><th>Scope</th><td>Manufacture and supply of cement</td></tr><tr><th>Certifying body</th><td>To be confirmed</td></tr><tr><th>Valid until</th><td>To be confirmed</td></tr></table><a class="link-arrow" href="downloads.html">Download certificate</a></div>
      <div class="icard"><span class="icard__icon">{I["leaf"]}</span><h3>ISO 14001:2015</h3><p>Environmental management system: dust, emissions, water, waste and energy monitored with annual targets and third-party audits.</p><table class="spec" style="margin-top:10px"><tr><th>Scope</th><td>Gazaria plant operations</td></tr><tr><th>Certifying body</th><td>To be confirmed</td></tr><tr><th>Valid until</th><td>To be confirmed</td></tr></table><a class="link-arrow" href="sustainability.html">Sustainability programme</a></div>
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>What it means for you</span>
      <p class="lead" style="margin-top:14px">A certificate is a promise that someone outside the company has checked the claim on the bag.</p>
      <p>The BSTI mark means the product has been tested by the national standards body and the factory is inspected. ISO 9001 means the process that makes it is documented, audited and continually improved. ISO 14001 means the same rigour is applied to the environment.</p>
      <p>For consultants and government projects we can provide certified copies, lot-wise test results and factory inspection reports on request.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Request documents</h4>
      <ul class="tips">
        <li><i>1</i>Certified copies of BSTI and ISO certificates.</li>
        <li><i>2</i>Lot-wise 2, 7 and 28-day strength results by batch number.</li>
        <li><i>3</i>Chemical analysis and chloride / SO₃ reports.</li>
        <li><i>4</i>Factory inspection and audit summaries for tender submissions.</li>
      </ul>
      <div class="phero__cta" style="margin-top:20px"><a class="btn btn--red btn--magnetic" href="index.html#quote"><span class="btn__label">Request documents</span>{ARROW}</a></div>
    </aside>
  </div></section>
  {cta("Specifying Anwar Cement?","Our technical team prepares tender documentation, certificates and mix-design support for consultants and contractors.")}'''),

 dict(slug="landmark-projects", group="Why Anwar", nav="Landmark Projects", title="Where Anwar Cement<br>stands <em>strong.</em>", eyebrow="Landmark Projects",
  desc="Landmark projects built with Anwar Cement: Rooppur Nuclear Power Plant, Payra Sea Port, Mayor Hanif Flyover, BSMMU Hospital, City Center and more.",
  lead="From a nuclear power plant to the capital's skyline, Anwar Cement is poured into the structures Bangladesh depends on every day. A selection of the projects we are proudest of.",
  bg="assets/img/decor/hanif.webp", stats=[("50+","Major projects"),("8","Divisions"),("2,400 MW","Largest project")],
  prev=("Certifications","certifications.html"), next=("Quality Assurance","quality-assurance.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Featured projects</span><h2 class="sec-title">Built with<br><em>Anwar.</em></h2></div><p class="sec-lead">Project facts are indicative placeholders; replace with the verified project list and supply details.</p></div>
    <div class="lms" data-stagger>
      {landmark("assets/img/decor/nuclear-power-plant.webp","Power · Pabna","Rooppur Nuclear Power Plant","Bangladesh's first nuclear power project, built to the most demanding concrete specifications in the country. Anwar Cement Special supplied for structural and mass-concrete pours.",("2,400","MW"),("2017","started"))}
      {landmark("assets/img/decor/payra-port.webp","Infrastructure · Patuakhali","Payra Sea Port","The nation's third seaport, standing in saline coastal ground where sulphate-resisting cement matters most. Shoktiman Cement for foundations and marine works.",("3rd","seaport"),("SR","cement"))}
      {landmark("assets/img/decor/hanif.webp","Transport · Dhaka","Mayor Hanif Flyover","The longest flyover in Bangladesh, carrying the capital's traffic over Jatrabari on precast and cast-in-place concrete.",("11.8","km"),("4","lanes"))}
      {landmark("assets/img/decor/bsmmu.webp","Healthcare · Dhaka","BSMMU Super Specialized Hospital","A 750-bed hospital where structural integrity is as critical as the care inside.",("750","beds"),("13","floors"))}
      {landmark("assets/img/decor/city-center.webp","Commercial · Motijheel, Dhaka","City Center","One of the tallest buildings in the country, rising from the heart of Dhaka's commercial district.",("37","floors"),("171","m"))}
      {landmark("assets/img/decor/banner-3.webp","Industrial · Munshiganj","Gazaria Industrial Belt","Factories, warehouses and worker housing along the Meghna, supplied direct from the plant next door.",("30+","sites"),("Bulk","supply"))}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>By sector</span><h2 class="sec-title">Every kind of<br><em>structure.</em></h2></div><a class="link-arrow" href="index.html#network">See the network map</a></div>
    <div class="grid4" data-stagger>
      {icard("factory","Power & energy","Nuclear, gas and solar plants; substations and transmission foundations.")}
      {icard("truck","Transport","Flyovers, bridges, highways, rail viaducts and port infrastructure.")}
      {icard("heart","Healthcare & education","Hospitals, medical universities, schools and campuses.")}
      {icard("award","Commercial & residential","High-rise towers, shopping centres, apartments and townships.")}
    </div>
  </div></section>

  <section class="psec"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Project supply</span>
      <p class="lead" style="margin-top:14px">Large projects need more than bags. They need a supply plan.</p>
      <p>For infrastructure and institutional projects we assign a dedicated technical service engineer, agree a delivery schedule with buffer stock at the nearest depot, and supply bulk by tanker where the site has silos. Lot-wise certificates travel with every delivery.</p>
      <p>Mix-design support, trial batches and cube testing are available at no charge for projects above an agreed volume.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Project support includes</h4>
      <ul class="tips">
        <li><i>1</i>Dedicated technical service engineer and site visits.</li>
        <li><i>2</i>Scheduled deliveries with depot buffer stock.</li>
        <li><i>3</i>Bulk tanker supply for sites with silos.</li>
        <li><i>4</i>Mix design, trial batches and cube testing.</li>
        <li><i>5</i>Lot-wise certificates and tender documentation.</li>
      </ul>
    </aside>
  </div></section>
  {cta("Your project could be next.","Talk to our project supply team about volumes, scheduling, bulk delivery and technical support.")}'''),
]


def product_body(pr):
    meters = "".join(f'<li class="meter"><div class="meter__row"><span>{n}</span><b>{v}</b></div><div class="meter__bar"><i style="width:{w}%"></i></div></li>' for n, v, w in pr["meters"])
    spec = "".join(f'<tr><th>{k}</th><td>{v}</td></tr>' for k, v in pr["spec"])
    uses = "".join(f'<div class="use"><i></i><b>{t}</b><span>{d}</span></div>' for t, d in pr["uses"])
    mixes = "".join(f'<tr><td><b>{m}</b></td><td>{u}</td><td>{q}</td></tr>' for m, u, q in pr["mixes"])
    others = "".join(f'<a href="{o}.html"><img src="{PMAP[o]["img"]}" alt=""><div><b>{PMAP[o]["nav"]}</b><span>{PMAP[o]["tag"]}</span></div><em>→</em></a>' for o in pr["others"])
    return f'''
  <section class="psec"><div class="container twocol">
    <div data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Performance</span>
      <h2 class="sec-title" style="margin-bottom:22px">Strength you can<br><em>specify.</em></h2>
      <ul class="pmeters" style="max-width:560px">{meters}</ul>
      <p style="font-size:12.5px;color:var(--steel);margin-top:16px">Typical values from our laboratory. Minimum guaranteed values are in the specification table. Figures are placeholders pending the official datasheet.</p>
      <div class="phero__cta" style="margin-top:24px"><a class="link-arrow" href="downloads.html">Download datasheet (PDF)</a><a class="link-arrow" href="downloads.html">Test certificate</a></div>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Technical specification</h4>
      <table class="spec">{spec}</table>
    </aside>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Applications</span><h2 class="sec-title">Where {pr["nav"]}<br>works <em>best.</em></h2></div><a class="link-arrow" href="index.html#products">Compare all three brands</a></div>
    <div class="uses" data-stagger>{uses}</div>
  </div></section>

  <section class="psec"><div class="container twocol">
    <div data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Mix guide</span>
      <h2 class="sec-title" style="margin-bottom:22px">Recommended<br><em>mixes.</em></h2>
      <table class="mixes"><tr><th>Mix</th><th>Use</th><th>Cement (approx.)</th></tr>{mixes}</table>
      <div class="phero__cta" style="margin-top:22px"><a class="btn btn--red btn--magnetic" href="calculator.html"><span class="btn__label">Open the cement calculator</span>{ARROW}</a></div>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Site tips</h4>
      <ul class="tips">
        <li><i>1</i>Store bags on a raised, dry platform, stacked no more than ten high, and use within 90 days of the packing date.</li>
        <li><i>2</i>Use clean, graded sand and aggregate; keep the water–cement ratio at or below 0.5 for structural work.</li>
        <li><i>3</i>Mix for at least two minutes in a mechanical mixer and place within 30 minutes of adding water.</li>
        <li><i>4</i>Cure continuously for a minimum of seven days (fourteen for slabs); composite cement rewards longer curing with higher final strength.</li>
        <li><i>5</i>In hot weather, place early in the morning or in the evening and shade freshly poured concrete.</li>
      </ul>
    </aside>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Other brands</span><h2 class="sec-title">Also from<br><em>Anwar Cement.</em></h2></div></div>
    <div class="other" data-stagger>{others}</div>
  </div></section>
  {cta("Order " + pr["nav"] + " today.", "Get a quotation with delivery to site, or find your nearest authorised dealer in all 64 districts.")}'''

def product_page(pr):
    chips = "".join(f'<span>{c}</span>' for c in pr["chips"])
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{pr["nav"]} — Anwar Cement</title>
  <meta name="description" content="{pr["desc"]}">
  <meta name="theme-color" content="#DD2930">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="{SITE}{pr["slug"]}.html">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <meta property="og:type" content="product"><meta property="og:site_name" content="Anwar Cement"><meta property="og:title" content="{pr["nav"]} — Anwar Cement"><meta property="og:description" content="{pr["desc"]}"><meta property="og:url" content="{SITE}{pr["slug"]}.html"><meta property="og:image" content="{SITE}{pr["img"]}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{pr["nav"]} — Anwar Cement"><meta name="twitter:description" content="{pr["desc"]}"><meta name="twitter:image" content="{SITE}{pr["img"]}">
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Sora-700-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Sora-600-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Manrope-500-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Manrope-400-latin.woff2" crossorigin>
  <link rel="stylesheet" href="css/fonts.css">
  <meta name="color-scheme" content="light dark">
  <script>(function(){{try{{var q=new URLSearchParams(location.search).get("theme");var t=q||localStorage.getItem("ac_theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}}})()</script>
  <link rel="stylesheet" href="css/style.css">
  <script>setTimeout(function(){{if(!document.documentElement.classList.contains("is-ready"))document.documentElement.classList.add("no-anim")}},4000)</script>
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"Product","name":"{pr["nav"]}","image":"{SITE}{pr["img"]}","description":"{pr["desc"]}","brand":{{"@type":"Brand","name":"Anwar Cement"}},"manufacturer":{{"@type":"Organization","name":"Anwar Cement Limited"}},"url":"{SITE}{pr["slug"]}.html"}}</script>
</head>
<body class="page">
  <a class="skip" href="#main">Skip to content</a>
{cursor}

{header}

  <main id="main">
  <section class="phero phero--product">
    <div class="phero__bg" style="background-image:url('{pr["bg"]}')"></div>
    <div class="container phero__in">
      <div>
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><i></i><a href="index.html#products">Products</a><i></i><span>{pr["nav"]}</span></nav>
        <span class="eyebrow"><span class="dot dot--red"></span>{pr["tag"]}</span>
        <h1 class="phero__title">{pr["title"]}</h1>
        <p class="phero__lead">{pr["lead"]}</p>
        <div class="phero__chips">{chips}</div>
        <div class="phero__cta"><a class="btn btn--red btn--lg btn--magnetic" href="index.html#quote"><span class="btn__label" data-i18n="cta.quote">Get a Quotation</span>{ARROW}</a><a class="btn btn--ghost btn--lg" href="index.html#dealers"><span class="btn__label">Find a dealer</span></a></div>
      </div>
      <div class="phero__bag" data-bag-static><img src="{pr["img"]}" alt="{pr["nav"]} bag"></div>
    </div>
  </section>
{product_body(pr)}
  <div class="container"><nav class="pnav" aria-label="Product pages" style="margin-bottom:clamp(40px,6vw,80px)">
    <a href="{pr["prev"][1]}"><small>Previous</small>{pr["prev"][0]}</a><a href="{pr["next"][1]}"><small>Next</small>{pr["next"][0]}</a>
  </nav></div>
  </main>

{footer}

{fab}

  <script src="config.js"></script>
  <script src="js/vendor/gsap.min.js"></script>
  <script src="js/vendor/ScrollTrigger.min.js"></script>
  <script src="js/vendor/lenis.min.js"></script>
  <script>if(!window.gsap)document.documentElement.classList.add("no-anim")</script>
  <script src="js/i18n.js"></script>
  <script src="js/calculator.js"></script>
  <script src="js/page.js"></script>
  <script src="js/motion.js"></script>
</body>
</html>
'''

def page(pg):
    stats = "".join(f'<div><b>{v}</b><span>{l}</span></div>' for v, l in pg["stats"])
    title_txt = re.sub(r"<[^>]+>", " ", pg["title"]).replace("  ", " ").strip()
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{pg["nav"]} — Anwar Cement</title>
  <meta name="description" content="{pg["desc"]}">
  <meta name="theme-color" content="#DD2930">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="{SITE}{pg["slug"]}.html">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
  <meta property="og:type" content="article"><meta property="og:site_name" content="Anwar Cement"><meta property="og:title" content="{pg["nav"]} — Anwar Cement"><meta property="og:description" content="{pg["desc"]}"><meta property="og:url" content="{SITE}{pg["slug"]}.html"><meta property="og:image" content="{SITE}assets/icons/og-image.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{pg["nav"]} — Anwar Cement"><meta name="twitter:description" content="{pg["desc"]}"><meta name="twitter:image" content="{SITE}assets/icons/og-image.jpg">
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Sora-700-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Sora-600-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Manrope-500-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Manrope-400-latin.woff2" crossorigin>
  <link rel="stylesheet" href="css/fonts.css">
  <meta name="color-scheme" content="light dark">
  <script>(function(){{try{{var q=new URLSearchParams(location.search).get("theme");var t=q||localStorage.getItem("ac_theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}}})()</script>
  <link rel="stylesheet" href="css/style.css">
  <script>setTimeout(function(){{if(!document.documentElement.classList.contains("is-ready"))document.documentElement.classList.add("no-anim")}},4000)</script>
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"{SITE}"}},{{"@type":"ListItem","position":2,"name":"{pg.get("group","Company")}"}},{{"@type":"ListItem","position":3,"name":"{pg["nav"]}","item":"{SITE}{pg["slug"]}.html"}}]}}</script>
</head>
<body class="page">
  <a class="skip" href="#main">Skip to content</a>
{cursor}

{header}

  <main id="main">
  <section class="phero">
    <div class="phero__bg" style="background-image:url('{pg["bg"]}')"></div>
    <div class="container phero__in">
      <div>
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><i></i><span>{pg.get("group","Company")}</span><i></i><span>{pg["nav"]}</span></nav>
        {('<span class="eyebrow"><span class="dot dot--red"></span>' + pg["eyebrow"] + '</span>') if pg["eyebrow"] else ''}
        <h1 class="phero__title">{pg["title"]}</h1>
        <p class="phero__lead">{pg["lead"]}</p>
      </div>
      <div class="phero__stats">{stats}</div>
    </div>
  </section>
{pg["body"]()}
  <div class="container"><nav class="pnav" aria-label="{pg.get("group","Company")} pages" style="margin-bottom:clamp(40px,6vw,80px)">
    <a href="{pg["prev"][1]}"><small>Previous</small>{pg["prev"][0]}</a><a href="{pg["next"][1]}"><small>Next</small>{pg["next"][0]}</a>
  </nav></div>
  </main>

{footer}

{fab}
{lightbox if pg.get("lightbox") else ""}
  <script src="config.js"></script>
  <script src="js/vendor/gsap.min.js"></script>
  <script src="js/vendor/ScrollTrigger.min.js"></script>
  <script src="js/vendor/lenis.min.js"></script>
  <script>if(!window.gsap)document.documentElement.classList.add("no-anim")</script>
  <script src="js/i18n.js"></script>
  <script src="js/calculator.js"></script>
  <script src="js/page.js"></script>
  <script src="js/motion.js"></script>
</body>
</html>
'''

# ---- calculator page: reuse the home-page section markup ----
calc_html = between(idx, '  <section class="calc" id="calculator">', "</section>")
_i = calc_html.index('<div class="sec-head" data-reveal>'); _j = calc_html.index('<div class="calc__card"', _i)
calc_html = calc_html[:_i] + calc_html[_j:]
calc_html = calc_html.replace('<section class="calc" id="calculator">', '<section class="calc" id="calculator" style="padding-top:clamp(40px,6vh,72px)">')
calc_html = relink(calc_html)
CALC = dict(slug="calculator", group="Tools", nav="Cement Calculator", title="Smart Cement<br><em>Calculator</em>", eyebrow="",
  desc="Free cement calculator for Bangladesh: bags of cement, sand, stone chips, bricks and cost for RCC slabs, columns, plaster, brickwork and flooring.",
  lead="Enter your dimensions and get cement bags, sand, aggregate, bricks and an estimated cost in seconds. Share the estimate with your mason or dealer on WhatsApp, or save it as a PDF.",
  bg="assets/img/decor/banner-2.webp", stats=[("5","Types of work"),("ft / m","Units"),("BDT","Cost estimate")],
  prev=("Landmark Projects","landmark-projects.html"), next=("Anwar Cement Special","product-anwar-special.html"),
  body=lambda: calc_html + f'''
  <section class="psec"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>How it works</span><h2 class="sec-title">Behind the<br><em>numbers.</em></h2></div><p class="sec-lead">The calculator uses standard Bangladeshi site practice. Every assumption is shown under "How we calculate" so your engineer can check it.</p></div>
    <div class="grid4" data-stagger>
      {icard("gear","Concrete","Dry volume = wet volume × 1.54, split by the mix ratio (M10 to M25). One 50 kg bag ≈ 0.0347 m³.","01")}
      {icard("factory","Plaster","Area × thickness (12, 15 or 20 mm), dry volume × 1.27, split by mortar ratio 1:4 to 1:6.","02")}
      {icard("shield","Brickwork","Standard 10 × 5 × 3 inch brick with mortar; mortar volume = wall volume − brick volume, dry × 1.33.","03")}
      {icard("drop","Water & wastage","Water at 0.45 of cement weight; 0–10% wastage on every material. Prices editable per bag, cft and brick.","04")}
    </div>
  </div></section>
  <section class="psec psec--alt"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Good to know</span>
      <p class="lead" style="margin-top:14px">An estimate is a starting point. Site conditions, workmanship and material grading all move the final number.</p>
      <p>Quantities are for reference. For structural work always follow the mix design and quantities in your engineer's drawings, and keep the water–cement ratio at or below 0.5.</p>
      <p>Our technical service team can review your estimate, recommend the right brand and connect you with the nearest dealer for delivery.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Which cement?</h4>
      <ul class="picks">
        <li><a href="product-anwar-special.html"><img src="assets/img/products/anwar-special-white.webp" alt=""><div><b>Anwar Cement Special</b><span>Slabs, columns, foundations and any structural pour.</span></div><em>→</em></a></li>
        <li><a href="product-shoktiman.html"><img src="assets/img/products/shoktiman-white.webp" alt=""><div><b>Shoktiman Cement</b><span>Coastal or saline sites, basements, tanks and floors.</span></div><em>→</em></a></li>
        <li><a href="product-lion.html"><img src="assets/img/products/lion-white.webp" alt=""><div><b>Lion Cement</b><span>Plaster, brickwork and residential work.</span></div><em>→</em></a></li>
      </ul>
    </aside>
  </div></section>
  {cta("Estimate done? Get it delivered.","Send the estimate with your quotation request and we will price it with delivery to your site.")}''')

DLICON = '<svg viewBox="0 0 24 24"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>'
def ncard(img, cat, date, title, text=""):
    return f'<a class="ncard" href="#" data-soon data-cursor="Read" data-cat="{cat.lower()}"><img src="{img}" alt="" loading="lazy" decoding="async"><div class="ncard__body"><span class="ncard__meta"><b>{cat}</b> · <time>{date}</time></span><h3>{title}</h3>{("<p>"+text+"</p>") if text else ""}</div></a>'
def gitem(img, cat, cap, cls=""):
    return f'<button type="button" class="gal__item {cls}" data-img="{img}" data-cat="{cat}" data-cursor="View"><img src="{img}" alt="{cap}" loading="lazy" decoding="async"><span>{cap}</span></button>'
def vcard(video, poster, title, meta):
    return f'<button class="vcard" type="button" data-video="{video}" data-cursor="Play"><img src="{poster}" alt="" loading="lazy" decoding="async"><span class="vcard__play"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l14-8z"/></svg></span><span class="vcard__body"><b>{title}</b><span>{meta}</span></span></button>'
def dlitem(kind, cat, title, meta):
    return f'<a class="dl-item" href="#" data-soon data-cat="{cat}"><span class="dl-item__ico">{kind}</span><div><b>{title}</b><span>{meta}</span></div><em>{DLICON}</em></a>'
def filters(group, cats):
    return '<div class="filters" data-filter-group="' + group + '">' + "".join(f'<button type="button" class="chipbtn chipbtn--light{" is-active" if i == 0 else ""}" data-filter="{v}">{l}</button>' for i, (v, l) in enumerate(cats)) + '</div>'

MEDIA = [
 dict(slug="news", group="Media", nav="News & Events", title="What's happening<br>at <em>Anwar Cement.</em>", eyebrow="News & Events", lightbox=False,
  desc="Latest news, press releases and events from Anwar Cement Limited.",
  lead="Company announcements, plant and technology updates, dealer events and project milestones. Headlines and dates are placeholders until the newsroom is populated.",
  bg="assets/img/decor/banner-1.webp", stats=[("12","Stories this year"),("4","Upcoming events"),("2026","Latest")],
  prev=("Downloads","downloads.html"), next=("Gallery","gallery.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="feat" data-reveal><img src="assets/img/decor/banner-1.webp" alt="" loading="lazy"><div class="feat__body"><span class="ncard__meta"><b>Company</b> · 12 Sep 2026</span><h2>Anwar Cement commissions new 60,000-tonne silo at Gazaria plant</h2><p>The expansion lifts storage capacity by 40% and shortens dispatch times for the southern districts. The silo was inaugurated by the Chairman of Anwar Group in the presence of dealers, engineers and local officials.</p><a class="link-arrow" href="#" data-soon>Read the full story</a></div></div>
    {filters(".newsgrid .ncard", [("all","All"),("company","Company"),("technology","Technology"),("projects","Projects"),("dealers","Dealers"),("csr","CSR")])}
    <div class="newsgrid" data-stagger>
      {ncard("assets/img/decor/banner-2.webp","Technology","28 Aug 2026","Vertical Roller Mill upgrade cuts energy use per tonne by 18%")}
      {ncard("assets/img/decor/nuclear-power-plant.webp","Projects","03 Aug 2026","Final concrete pour completed at Rooppur Unit 2 with Anwar Cement Special")}
      {ncard("assets/img/decor/city-center.webp","Dealers","19 Jul 2026","Dealer conference 2026: 1,200 partners gather in Dhaka")}
      {ncard("assets/img/decor/payra-port.webp","Projects","02 Jul 2026","Shoktiman Cement selected for Payra port phase two marine works")}
      {ncard("assets/img/decor/background.webp","Company","15 Jun 2026","Anwar Cement receives ISO 14001 recertification after third-party audit")}
      {ncard("assets/img/decor/hanif.webp","CSR","30 May 2026","Mason training programme graduates its 1,000th participant in Gazaria")}
      {ncard("assets/img/decor/bsmmu.webp","Projects","11 May 2026","BSMMU hospital extension tops out with Anwar Cement Special")}
      {ncard("assets/img/decor/banner-3.webp","Company","22 Apr 2026","Smart cement calculator and online quotation launched on anwarcement.com")}
      {ncard("assets/img/decor/footer.webp","Technology","05 Apr 2026","Online particle-size analysis installed on the grinding line")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Upcoming events</span><h2 class="sec-title">Meet us<br><em>in person.</em></h2></div><p class="sec-lead">Dealer meets, engineer seminars and plant visits. Dates are indicative.</p></div>
    <div class="events" data-stagger>
      <div class="event"><div class="event__date"><b>14</b><span>Oct</span></div><div><h3>Engineers' seminar: durable concrete in coastal ground</h3><p>Chattogram · Radisson Blu · 10:00–13:00 · with the Technical Services team</p></div><a class="link-arrow" href="index.html#quote">Register</a></div>
      <div class="event"><div class="event__date"><b>28</b><span>Oct</span></div><div><h3>Plant open day for consultants and contractors</h3><p>Gazaria, Munshiganj · 09:00–15:00 · transport from Dhaka provided</p></div><a class="link-arrow" href="index.html#quote">Register</a></div>
      <div class="event"><div class="event__date"><b>12</b><span>Nov</span></div><div><h3>Regional dealer meet, Khulna division</h3><p>Khulna · City Inn · 18:00 · by invitation</p></div><a class="link-arrow" href="index.html#dealers">Dealer locator</a></div>
      <div class="event"><div class="event__date"><b>05</b><span>Dec</span></div><div><h3>Mason training camp, Rangpur</h3><p>Rangpur · free two-day course · certificates for graduates</p></div><a class="link-arrow" href="sustainability.html">About the programme</a></div>
    </div>
  </div></section>
  {cta("Press and media enquiries.","For interviews, images and company statements, contact our corporate communications team.")}'''),

 dict(slug="gallery", group="Media", nav="Gallery", title="The plant, the people,<br>the <em>projects.</em>", eyebrow="Gallery", lightbox=True,
  desc="Photo gallery: Anwar Cement plant, landmark projects, events and products.",
  lead="Photographs from the Gazaria plant, the landmark projects we supply and the events we host. Click any image to view it full size.",
  bg="assets/img/decor/footer.webp", stats=[("4","Albums"),("120+","Photos"),("HD","Downloads")],
  prev=("News & Events","news.html"), next=("TVC & Campaigns","tvc.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    {filters(".galgrid .gal__item", [("all","All"),("plant","Plant"),("projects","Projects"),("events","Events"),("products","Products")])}
    <div class="galgrid" data-stagger>
      {gitem("assets/img/decor/nuclear-power-plant.webp","projects","Rooppur NPP, Pabna","gal__item--tall")}
      {gitem("assets/img/decor/banner-1.webp","plant","Gazaria plant silo")}
      {gitem("assets/img/decor/payra-port.webp","projects","Payra Sea Port")}
      {gitem("assets/img/decor/hanif.webp","projects","Mayor Hanif Flyover, Dhaka","gal__item--wide")}
      {gitem("assets/img/decor/bsmmu.webp","projects","BSMMU Hospital")}
      {gitem("assets/img/decor/city-center.webp","projects","City Center, Motijheel")}
      {gitem("assets/img/decor/banner-2.webp","plant","Aggregate line")}
      {gitem("assets/img/products/anwar-special-white.webp","products","Anwar Cement Special")}
      {gitem("assets/img/decor/background.webp","plant","Mill building","gal__item--wide")}
      {gitem("assets/img/products/shoktiman-white.webp","products","Shoktiman Cement")}
      {gitem("assets/img/decor/footer.webp","plant","Packing plant","gal__item--tall")}
      {gitem("assets/img/products/lion-white.webp","products","Lion Cement")}
      {gitem("assets/img/decor/banner-3.webp","events","Dealer conference 2026")}
      {gitem("assets/img/decor/city-center.webp","events","Engineers' seminar, Dhaka")}
    </div>
  </div></section>
  {cta("Need high-resolution images?","Press and partners can request the full media kit with logos, product shots and plant photography.")}'''),

 dict(slug="tvc", group="Media", nav="TVC & Campaigns", title="Our brand<br><em>films.</em>", eyebrow="TVC & Campaigns", lightbox=True,
  desc="Anwar Cement television commercials, brand films and campaigns.",
  lead="Television commercials, documentaries and digital campaigns for Anwar Cement Special, Shoktiman Cement and Lion Cement. Click to play.",
  bg="assets/img/decor/banner-3.webp", stats=[("6","Films"),("3","Brands"),("2026","Latest campaign")],
  prev=("Gallery","gallery.html"), next=("Downloads","downloads.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    <div class="tvc tvc--feat" data-reveal>{vcard("assets/video/hero-3.mp4","assets/img/decor/banner-3.webp","Brand film 2026: Strength of Bangladesh","Campaign film · 0:10 · EN/বাংলা")}</div>
    <div class="sec-head" data-reveal style="margin-top:clamp(28px,4vw,56px)"><div><span class="eyebrow"><span class="dot dot--red"></span>All films</span><h2 class="sec-title">Commercials &amp;<br><em>documentaries.</em></h2></div></div>
    <div class="tvc" data-stagger>
      {vcard("assets/video/hero-1.mp4","assets/img/decor/background.webp","Inside the Gazaria plant","Documentary · 0:08")}
      {vcard("assets/video/hero-2.mp4","assets/img/decor/banner-1.webp","Shoktiman: built for tough ground","TVC · 0:08")}
      {vcard("assets/video/hero-4.mp4","assets/img/decor/hanif.webp","Landmarks built with Anwar","Showreel · 0:08")}
      {vcard("assets/video/hero-3.mp4","assets/img/decor/city-center.webp","Lion Cement: every home deserves the best","TVC · 0:10")}
      {vcard("assets/video/hero-1.mp4","assets/img/decor/nuclear-power-plant.webp","Anwar Cement Special at Rooppur","Project film · 0:08")}
      {vcard("assets/video/hero-2.mp4","assets/img/decor/payra-port.webp","Mason training programme","CSR film · 0:08")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container">
    <div class="sec-head" data-reveal><div><span class="eyebrow"><span class="dot dot--red"></span>Campaigns</span><h2 class="sec-title">On air and<br><em>on site.</em></h2></div></div>
    <div class="grid3" data-stagger>
      {icard("spark","Strength of Bangladesh","2026 brand campaign across TV, digital and outdoor, anchored on the landmarks built with Anwar Cement.")}
      {icard("shield","Shoktiman: Tough Ground","Regional campaign for the coastal belt on sulphate resistance, with dealer activations in Khulna and Barishal.")}
      {icard("heart","Lion: Every Home","Residential campaign with mason endorsements and the online cement calculator as its call to action.")}
    </div>
  </div></section>
  {cta("Want to feature our films?","Broadcast-quality files and campaign assets are available for partners and media.")}'''),

 dict(slug="downloads", group="Media", nav="Downloads", title="Brochures, datasheets<br>&amp; <em>certificates.</em>", eyebrow="Downloads", lightbox=False,
  desc="Download Anwar Cement product datasheets, brochures, test certificates and company documents.",
  lead="Everything a consultant, contractor or dealer needs in one place. Files are placeholders until the official documents are uploaded.",
  bg="assets/img/decor/bsmmu.webp", stats=[("14","Documents"),("PDF","Format"),("EN/বাং","Languages")],
  prev=("TVC & Campaigns","tvc.html"), next=("News & Events","news.html"),
  body=lambda: f'''
  <section class="psec"><div class="container">
    {filters(".dls .dl-item", [("all","All"),("datasheets","Datasheets"),("brochures","Brochures"),("certificates","Certificates"),("company","Company"),("dealers","For dealers")])}
    <div class="dls" data-stagger>
      {dlitem("PDF","datasheets","Anwar Cement Special · Product datasheet","CEM II/A-M (V-L) 42.5N · 2 pages · 1.1 MB")}
      {dlitem("PDF","datasheets","Shoktiman Cement · Product datasheet","CEM II/A-M 42.5N SR · 2 pages · 1.0 MB")}
      {dlitem("PDF","datasheets","Lion Cement · Product datasheet","CEM II/A-M · 2 pages · 0.9 MB")}
      {dlitem("PDF","datasheets","Mix design guide","Recommended mixes for slabs, columns, plaster and brickwork · 6 pages")}
      {dlitem("PDF","brochures","Corporate brochure 2026","Company, plant, brands and network · 16 pages · 8 MB")}
      {dlitem("PDF","brochures","Product range brochure","Three brands, one standard · 8 pages · 4 MB")}
      {dlitem("PDF","brochures","পণ্য ব্রোশিওর (বাংলা)","তিনটি ব্র্যান্ড, একটি মান · ৮ পৃষ্ঠা")}
      {dlitem("PDF","certificates","BSTI certification mark","All three brands · valid until (TBC)")}
      {dlitem("PDF","certificates","ISO 9001:2015 certificate","Quality management system · Gazaria plant")}
      {dlitem("PDF","certificates","ISO 14001:2015 certificate","Environmental management system")}
      {dlitem("PDF","certificates","Sample lot test certificate","Format of the certificate that travels with every dispatch")}
      {dlitem("PDF","company","Sustainability report 2025","Emissions, energy, water, safety and community · 24 pages")}
      {dlitem("ZIP","company","Logo & brand assets","Vector logos, colours and usage guide · 12 MB")}
      {dlitem("PDF","dealers","Dealer application form","Become an authorised Anwar Cement dealer")}
    </div>
  </div></section>

  <section class="psec psec--alt"><div class="container twocol">
    <div class="prose" data-reveal>
      <span class="eyebrow"><span class="dot dot--red"></span>Can't find it?</span>
      <p class="lead" style="margin-top:14px">Lot-wise test results, tender documentation and certified copies are available on request.</p>
      <p>Send us the batch number printed on the bag, or the project name and required documents, and our technical team will respond within one working day.</p>
    </div>
    <aside class="aside-card" data-reveal>
      <h4>Request documents</h4>
      <ul class="tips">
        <li><i>1</i>Certified copies of BSTI and ISO certificates.</li>
        <li><i>2</i>Lot-wise 2, 7 and 28-day strength results.</li>
        <li><i>3</i>Chemical analysis and chloride / SO₃ reports.</li>
      </ul>
      <div class="phero__cta" style="margin-top:20px"><a class="btn btn--red btn--magnetic" href="index.html#quote"><span class="btn__label">Request documents</span>{ARROW}</a></div>
    </aside>
  </div></section>
  {cta("Specifying Anwar Cement?","Our technical team prepares tender documentation and certificates for consultants and contractors.")}'''),
]

for pg in PAGES + WHY + [CALC] + MEDIA:
    open(os.path.join(ROOT, pg["slug"] + ".html"), "w", encoding="utf-8").write(page(pg))
    print("wrote", pg["slug"] + ".html")

for pr in PRODUCTS:
    open(os.path.join(ROOT, pr["slug"] + ".html"), "w", encoding="utf-8").write(product_page(pr))
    print("wrote", pr["slug"] + ".html")

# sitemap
today = datetime.date.today().isoformat()
urls = [("", "1.0")] + [(f"{p['slug']}.html", "0.9") for p in PRODUCTS] + [("calculator.html", "0.9")] + [(f"{p['slug']}.html", "0.7") for p in PAGES + WHY + MEDIA] + [("#products", "0.9"), ("#dealers", "0.8"), ("#quote", "0.8")]
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f'  <url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>\n' for u, p in urls) + "</urlset>\n"
open(os.path.join(ROOT, "sitemap.xml"), "w").write(sm)
print("sitemap updated")
