# haureesh: personal portfolio site

A static multi-page site (HTML and CSS only). There's no build step. The only JavaScript is a one-line `onerror` on each image, which shows a styled placeholder when the photo file is missing.

Pages: `index.html`, `projects.html`, `about.html`, `experience.html`, `awards.html`, `contact.html`, `404.html`.

## Add a photo or scan
Save a JPG with the **exact filename** below. The "coming soon" placeholder disappears on its own. Use files about 1600px wide, compressed to under 400 KB. Before scanning, cover any home address, birth date, ID numbers or scores.

### assets/photos/
| File | Where it shows |
|---|---|
| headshot.jpg | Home bento grid (large tile) |
| about-portrait.jpg | About page (portrait, 3:4) |
| aerospace-club.jpg | Projects #1 and the Aerospace Club activity card |
| model-rocket.jpg | Projects #2 |
| robot-arm.jpg | Projects #3 |
| ai-research.jpg | Projects #4 (a chart or figure works well) |
| smash.jpg | Projects #5 |
| vibha.jpg | Awards & Activities: Vibha |
| podcast.jpg | Awards & Activities: Podcast Club |
| orchestra.jpg | Awards & Activities: Chamber Orchestra |
| wrestling.jpg | Awards & Activities: Wrestling |
| martial-arts.jpg | Awards & Activities: Martial Arts |

### assets/certificates/
| File | Award |
|---|---|
| ap-scholar-distinction.jpg | AP Scholar with Distinction (Jul 2026) |
| cb-school-recognition.jpg | College Board School Recognition Award (Jun 2026) |
| ap-scholar.jpg | AP Scholar (Jul 2025) |
| pvsa-silver.jpg | Presidential Volunteer Service Award, Silver (Feb 2025) |
| mtac-cm-level8.jpg | MTAC Certificate of Merit, Piano Level 8 (Feb 2025) |
| most-improved-wrestler.jpg | Most Improved Wrestler (Feb 2025) |
| scholar-athlete.jpg | DVHS Scholar Athlete (Feb 2025) |
| vibha-gold.jpg | Gold Vibha Volunteer Service Award |
| black-belt.jpg | 2nd Degree Black Belt (Nov 2022) |

Other assets: `assets/favicon.svg` and `assets/og.png` (the social share preview; replace it with a nicer 1200×630 image if you like).

## Content still to fill in
- About page: a dashed "Placeholder" box for a short quote in Haureesh's own words.
- Experience and Home: "Seasonal Camp Work: details coming soon" (organization, role and dates).

## Themes
Set the theme with `data-theme` on `<html>`: `ocean` (default), `original`, `midnight`, `sunset` or `mono`. The colors are CSS variables at the top of `style.css`. Previews are in `themes/`.

## Editing
Pages are generated from `/workspace/haureesh/site_src/gen.py` (`python3 gen.py [theme] [outdir]`). You can also edit the HTML directly.

## Preview locally
`python3 -m http.server 8080` in this folder, then open http://localhost:8080

## Deploy (needs an account; not done yet)
- **Netlify Drop:** drag this folder onto https://app.netlify.com/drop.
- **GitHub Pages:** push to a repo, then go to Settings > Pages and deploy from the main branch. Add a file named `CNAME` containing `haureesh.vellamsetti.com`.
- **Cloudflare Pages** works the same way.
- **Custom domain (GoDaddy):** in the DNS settings for vellamsetti.com, add a CNAME record with host `haureesh`, pointing to `<user>.github.io` or `<site>.netlify.app`. Then set `haureesh.vellamsetti.com` as the custom domain in the host's settings, and enable HTTPS.
- **Before publishing:** the og:url and og:image tags assume https://haureesh.vellamsetti.com/. Change `URL` in gen.py if the domain is different.
