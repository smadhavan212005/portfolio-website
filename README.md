# Madhavan S – Portfolio

Static portfolio built with **Vite**, **anime.js v4** (`npm install animejs`) and **Lenis** smooth scroll.

```
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve dist/ locally
```

## Project layout
- `index.html` – content, SEO meta tags and JSON-LD
- `src/main.js` – all animation logic; `src/style.css` – styles and themes
- `public/` – optimised photos (`img/thumb`, `img/full`), icons and the social-share image
- `vite.config.js` – build config; also generates `sitemap.xml` and `robots.txt`

## Deploy on GitHub Pages
1. Create a GitHub repo and push this folder to the `main` branch.
   - Repo named `<username>.github.io` → site at `https://<username>.github.io/`
   - Any other name → site at `https://<username>.github.io/<repo>/`
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, builds and publishes the site.

The workflow works out the public URL by itself and writes it into the canonical tag, Open Graph tags,
sitemap and robots.txt. For a custom domain, add a repository variable named `SITE_URL`
(Settings → Secrets and variables → Actions → Variables), e.g. `https://example.com/`.

## Get listed on Google
1. Open [Google Search Console](https://search.google.com/search-console) → **Add property** → *URL prefix* → your site URL.
2. Verify ownership (HTML tag method: paste the `google-site-verification` meta tag inside `<head>` of `index.html`, redeploy, click Verify).
3. **Sitemaps** → submit `sitemap.xml`. Then **URL Inspection** → paste the site URL → **Request indexing**.
4. Optional: repeat on [Bing Webmaster Tools](https://www.bing.com/webmasters) (it can import from Search Console).
