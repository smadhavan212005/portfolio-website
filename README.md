# Madhavan S — Portfolio

Personal portfolio of **Madhavan S**, an Electronics & Communication Engineering undergraduate working on RTL design & verification, embedded systems and agentic AI for hardware.

**Live site:** https://smadhavan.me

---

## About me

I'm pursuing two degrees in parallel: a **B.E. in Electronics & Communication Engineering** at PSG Institute of Technology and Applied Research (CGPA 8.22 through 6th semester) and a **B.S. in Electronics Systems** at IIT Madras (CGPA 8.00). My work sits where digital hardware meets intelligent tooling.

**Highlights**

- **VIGIL AI** — an agentic AI framework for RTL verification: it compares RTL versions, analyses downstream impact, prioritises test cases and finds coverage gaps and corner cases. First runner-up at **SAP Hackfest '26**.
- **Hardware Research Intern, DRDO – CVRDE** — designed the hardware interface of a solid state power controller: STM32F407, isolated gate driver, power MOSFET, Kelvin-shunt current sensing and dual-path (I²t + DESAT) overcurrent protection.
- **IEEE author** — *Real-Time Detection of AI-Generated Voice Using Machine Learning and MATLAB Simulink* (ICIIET 2025) and *A Deep Learning Framework for Spatiotemporal Air Quality Forecasting* (IC(SEC)² 2026).
- **DVCon India Fellow 2026**, **Young Innovator 2026** (PSG iTech), and finalist or semi-finalist at CUKCS-AITHON, SanDisk, AISEHack, NXP AIM and L&T TECHgium.
- Previous work in AI/IoT (YOLOv8 attendance system on Raspberry Pi 5, 96% detection accuracy), front-end development for FirstDay AI, and IoT hardware (live bus tracking, thermal-image foot ulcer detection).

**Contact:** [smadhavan212005@gmail.com](mailto:smadhavan212005@gmail.com) · [LinkedIn](https://linkedin.com/in/s--madhavan) · [GitHub](https://github.com/smadhavan212005)

---

## About this portfolio

A single-page, scroll-driven portfolio built to feel like a product rather than a template. Every section has its own scroll animation, all driven by **anime.js v4**, on top of buttery smooth scrolling. It is fully static, so it can be hosted anywhere for free.

### Features

| Area | What it does |
| --- | --- |
| **Dynamic-island navigation** | A glossy black pill that expands into the full menu on hover (desktop) or tap (mobile), shows the current section name when collapsed, and keeps the theme toggle always visible. |
| **Scroll-percentage island** | A circular gauge that fills with animated liquid as you scroll and shows the percentage; click it to return to the top. |
| **Hero** | Circuit-board traces that draw themselves, a springy letter-by-letter name reveal, a rotating role line, and parallax that follows the pointer and the scroll. |
| **Experience** | A pinned, sideways-scrolling card row paired with a dated timeline. A pin slides along the axis as you scroll, the active role highlights, and clicking a role bar jumps to its card. |
| **Projects** | Sticky cards that stack; earlier cards recede as the next slides over. |
| **Research, Achievements, Skills** | Each uses a different scrubbed effect: swinging pages, clip-path wipes, folding groups, chips that pop in one by one. |
| **Photography** | Three galleries (nature, portrait, events) with a masonry grid, a keyboard and swipe-friendly lightbox, and thumbnails optimised for the web. |
| **Themes** | Dark (charcoal + vermilion) and light (warm paper), remembered between visits. |
| **Resume** | One-click PDF download from the hero. |

### Design and engineering notes

- **Scroll-synced animation.** Effects use anime.js `onScroll` in sync mode, so animation progress is tied directly to scroll position and reverses when you scroll back up.
- **Responsive by design.** Phones get lighter fade-up effects instead of large horizontal movements; the pinned Experience section measures its content live and falls back to a native swipeable row on very short screens (small phones, landscape).
- **Accessible.** Semantic HTML, keyboard-operable controls, focus management in dialogs, `prefers-reduced-motion` support (everything stays fully usable and static), and `aria` labels on the interactive islands.
- **Fast.** No framework or runtime dependencies beyond anime.js and Lenis (~50 KB gzipped JS); photos are served as 900 px thumbnails and only opened at 2000 px in the lightbox.
- **Search-friendly.** Titles, descriptions, canonical URL, Open Graph / Twitter cards, JSON-LD (Person schema), an auto-generated `sitemap.xml` and `robots.txt`.

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Animation engine | [anime.js](https://animejs.com/) v4 (`animate`, `createTimeline`, `stagger`, `splitText`, `onScroll`, `utils`) |
| Smooth scrolling | [Lenis](https://lenis.darkroom.engineering/) |
| Build tooling | [Vite](https://vite.dev/) |
| Language | Vanilla JavaScript (ES modules), HTML5, modern CSS (custom properties, `clip-path`, `color-mix`, `position: sticky`) |
| Icons and fonts | Font Awesome 6; Bricolage Grotesque, DM Sans and IBM Plex Mono (Google Fonts) |
| Hosting and CI | GitHub Pages with GitHub Actions |

---

## Project structure

```
.
├── index.html               # All content, SEO meta tags and JSON-LD
├── src/
│   ├── main.js              # Navigation island, scroll gauge, timeline, gallery and every animation
│   ├── style.css            # Design tokens, themes, layout, responsive rules
│   └── gallery-data.js      # Aspect ratios so the photo grid never jumps while loading
├── public/
│   ├── img/thumb, img/full  # Optimised photos (900 px and 2000 px)
│   ├── madhavan_s_resume_hw.pdf
│   └── me.jpg, og-image.jpg, favicon.png, apple-touch-icon.png
├── vite.config.js           # Build config; generates sitemap.xml and robots.txt
└── .github/workflows/deploy.yml   # Build and deploy to GitHub Pages
```

---

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve dist/ locally
```

## Customising

- **Content:** edit the text directly in `index.html`.
- **Experience timeline:** each card in `#expTrack` carries `data-start`, `data-end` (`YYYY-MM` or `now`) and `data-short`; the bars, durations and pin positions are generated from these.
- **Photos:** add `<category><n>.jpg` files to `public/img/thumb` (≈900 px) and `public/img/full` (≈2000 px), then update the ratio list in `src/gallery-data.js` and the photo count on the card in `index.html`.
- **Colours and fonts:** change the tokens at the top of `src/style.css` (`:root` for dark, `[data-theme="light"]` for light).
- **Resume:** replace `public/madhavan_s_resume_hw.pdf` and keep the file name.

## Deployment (GitHub Pages + custom domain)

The site is published from the `portfolio-website` repository to **https://smadhavan.me** using GitHub Actions.

1. Push this folder to the `main` branch of the repository.
2. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
3. **Settings → Pages → Custom domain:** enter `smadhavan.me`, save, and tick **Enforce HTTPS** once the certificate is issued (this can take a few minutes after DNS is set).
4. Every push to `main` runs `.github/workflows/deploy.yml`, which installs, builds and publishes the site.

**DNS records** (at your domain registrar):

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `smadhavan212005.github.io` |

Optionally add the matching `AAAA` records listed in the [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

`public/CNAME` contains the domain, and the public URL is written into the canonical tag, Open Graph tags, sitemap and `robots.txt` at build time. To change it, edit the fallback in `vite.config.js` or set a repository variable named `SITE_URL` (Settings → Secrets and variables → Actions → Variables).

> **First deploy fails with "Get Pages site failed / Not Found"?** GitHub Pages isn't switched on for the repository yet. Do step 2 above, then open the **Actions** tab and click **Re-run failed jobs** (or push any commit). This is a one-time setting; the workflow cannot enable it on its own.

### Getting listed on Google

1. Add your site as a *URL prefix* property in [Google Search Console](https://search.google.com/search-console).
2. Verify ownership (for the HTML-tag method, paste the `google-site-verification` meta tag into `<head>` in `index.html` and redeploy).
3. Submit `sitemap.xml` under **Sitemaps**, then use **URL Inspection → Request indexing** on the home page.

---

© 2026 Madhavan S. All rights reserved.
