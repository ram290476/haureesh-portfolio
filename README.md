# haureesh: personal portfolio site

A static one-page site (`index.html`, `style.css`, `main.js`). There is no build step.

Sections on the home page: Home, Projects, Awards, Experience, About, Contact. The old filenames redirect to those sections:

| Old page | Opens |
|---|---|
| `projects.html` | `#projects`, and keeps `#aerospace-club`, `#model-rocket`, `#robot-arm`, `#ai-research`, `#smash` |
| `awards.html` | `#awards` |
| `experience.html` | `#experience` |
| `about.html` | `#about` |
| `contact.html` | `#contact` |

`404.html` stays a real not-found page. It uses root-absolute paths (`/style.css`, `/assets/...`) so it can render for any missing URL when a host serves it.

Every HTML page sends `noindex`. `robots.txt` disallows crawling. That asks crawlers to skip the site. It is not an access control.

## Add a photo or scan

Save a JPG with the **exact filename** below. The labeled placeholder disappears on its own. Use files about 1600px wide, compressed to under 400 KB. Before scanning, cover any home address, birth date, ID numbers, or scores. Do not add a generated image of Haureesh.

### assets/photos/

| File | Where it shows |
|---|---|
| headshot.jpg | Home bento (large tile) |
| about-portrait.jpg | About (portrait, 3:4) |
| aerospace-club.jpg | Projects: Aerospace Club |
| model-rocket.jpg | Projects: Model Rocket |
| robot-arm.jpg | Projects: SO-101 arm |
| ai-research.jpg | Projects: AI safety research |
| smash.jpg | Projects: SMASH |
| vibha.jpg | Awards ring: Vibha |
| podcast.jpg | Awards ring: Podcast |
| orchestra.jpg | Awards ring: Cello |
| wrestling.jpg | Awards ring: Wrestling |
| martial-arts.jpg | Awards ring: Black Belt |

### assets/certificates/

| File | Award |
|---|---|
| ap-scholar-distinction.jpg | AP Scholar with Distinction (Jul 2026) |
| ap-scholar.jpg | AP Scholar (Jul 2025) |
| pvsa-silver.jpg | Presidential Volunteer Service Award, Silver (2024 on the scan) |
| mtac-cm-level8.jpg | MTAC Certificate of Merit, Piano Level 8 (Feb 2025) |
| most-improved-wrestler.jpg | Older placeholder. The published award is the JV Wrestling Most Improved plaque for 2024–2025. |
| scholar-athlete.jpg | DVHS Scholar Athlete (Feb 2025) |
| black-belt.jpg | Older placeholder. Published scans: 1st degree October 24, 2020 and 2nd degree April 29, 2023. |

Leave these off the site. They are not confirmed: Vibha Gold, and the College Board School Recognition award.

The majors line is exactly Physics, Aerospace, Mechanical, CS, Data Science, Electrical. Do not add Materials or Engineering Physics. Do not add a GPA, test scores, a street address, a phone number, or a birthday.

Other assets: `assets/favicon.svg` and `assets/og.png` (the social share preview).

## Content still to fill in

- About: a dashed "Placeholder" box for a short quote in Haureesh's own words.
- Experience: "Seasonal Camp Work: details coming soon" (organization, role, and dates).
- Rocket spec sheet: motor class and recovery system, shown in brackets until they are confirmed.

## Preview locally

`python3 -m http.server 8080` in this folder, then open http://localhost:8080

## Deploy

See [DEPLOY.md](DEPLOY.md). GitHub Pages publishes the `main` branch. Do not publish until Ram says to.
