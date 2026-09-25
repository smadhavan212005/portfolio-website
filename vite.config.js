import { defineConfig } from 'vite';

// Public URL of the deployed site. The GitHub Actions workflow sets SITE_URL automatically;
// change the fallback below (or set a repo variable named SITE_URL) if you use a custom domain.
const SITE_URL = (process.env.SITE_URL || 'https://smadhavan212005.github.io/').replace(/\/?$/, '/');

/** Fills the __SITE_URL__ placeholders in index.html and emits sitemap.xml + robots.txt for search engines. */
const seo = () => ({
  name: 'seo',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', SITE_URL),
  generateBundle() {
    const day = new Date().toISOString().slice(0, 10);
    this.emitFile({
      type: 'asset', fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}</loc>\n    <lastmod>${day}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
    });
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n` });
  },
});

export default defineConfig({ base: './', plugins: [seo()] });
