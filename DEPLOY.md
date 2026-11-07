# Deploying to haureesh.vellamsetti.com (GitHub Pages + GoDaddy)

**Do not do this until Ram says to publish.**

The site is one page. `projects.html`, `about.html`, `experience.html`, `awards.html`, and `contact.html` redirect to sections on `index.html`. `404.html` uses *root-absolute* paths (`/style.css`, `/assets/...`) so it renders on any missing path; it only renders fully when served from a web server. Canonical and social URLs use `https://haureesh.vellamsetti.com/`.

GitHub Pages for this repo publishes the `main` branch only. A review branch does not change the live site.

1. Push the contents of `website_deploy/` (incl. `CNAME`, `.nojekyll`) to the root of a repo under `ram290476`, e.g. `ram290476/haureesh-site`.
2. GitHub → repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. GoDaddy → My Products → vellamsetti.com → DNS → Add record:
   - Type **CNAME**, Name/Host **haureesh**, Value **ram290476.github.io** (no repo name), TTL 1 hour (default).
   - Remove any existing A/CNAME record for `haureesh` that conflicts.
4. Back in Pages settings, Custom domain: `haureesh.vellamsetti.com` → Save, wait for the DNS check to pass.
5. Tick **Enforce HTTPS** once the certificate is issued (can take up to ~1 hour).
6. Verify: `dig haureesh.vellamsetti.com CNAME +short` → `ram290476.github.io.`; open https://haureesh.vellamsetti.com/ and a bogus path to see the 404.
7. (Optional) Verify the domain under GitHub → Settings → Pages → Verified domains to prevent takeover.

## Going public (allow indexing)
`robots.txt` currently has `Disallow: /`. To allow search engines, change it to:
```
User-agent: *
Allow: /
Sitemap: https://haureesh.vellamsetti.com/sitemap.xml
```
(Or edit `robots.txt` directly.)
