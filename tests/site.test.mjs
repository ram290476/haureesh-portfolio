import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { footerProblems } from "../scripts/footer.mjs";

const projectPages = [
  "projects/aerospace-club.html",
  "projects/robot-arm.html",
  "projects/ai-research.html",
  "projects/smash.html"
];
const activityPages = [
  "activities/vibha.html",
  "activities/best-brains.html",
  "activities/piano.html",
  "activities/podcasting.html",
  "activities/orchestra.html",
  "activities/wrestling.html",
  "activities/karate.html"
];
const pages = ["index.html", "projects.html", "awards.html", "activities.html", "experience.html", "about.html", "contact.html", "404.html", ...projectPages, ...activityPages];
const nav = ["Home", "Projects", "Awards", "Activities", "Experience", "About", "Contact"];

function read(name) {
  return readFileSync(new URL("../" + name, import.meta.url), "utf8");
}

test("robots.txt still blocks the whole site", () => {
  const robots = read("robots.txt");
  const active = robots.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#")).join("\n");
  assert.equal(active, "User-agent: *\nDisallow: /");
});

test("every page is noindex and shares the menu order", () => {
  for (const name of pages) {
    const html = read(name);
    assert.match(html, /<meta name="robots" content="noindex">/);
    const labels = [...html.matchAll(/<nav aria-label="Main">([\s\S]*?)<\/nav>/g)][0][1];
    const links = [...labels.matchAll(/>([^<]+)<\/a>/g)].map((match) => match[1]);
    assert.deepEqual(links, nav);
  }
});

test("path timeline stays on the homepage only", () => {
  const home = read("index.html");
  assert.match(home, /The path so far/);
  assert.match(home, /id="timeline"/);
  assert.equal(home.includes("spiral-scroll"), false);
  for (const year of ["2023", "2024", "2025", "2026", "2027"]) {
    assert.match(home, new RegExp("<b>" + year + "</b>"));
  }
  assert.match(home, /<b>2022<\/b><p>NPA Local Winner, Intermediate\./);
  assert.match(home, /<b>2017<\/b><p>NPA Local Winner, Elementary\./);
  assert.match(home, /<b>2020<\/b><ul class="year-points"><li>NPA Local Winner, Elementary\.<\/li><li>Earned a 1st degree black belt on October 24\.<\/li><\/ul>/);
  assert.match(home, /<b>2024<\/b><ul class="year-points"><li>Joined Wildcat Way Podcast Club as treasurer\.<\/li><li>JV Wrestling Most Improved Wrestler\.<\/li><\/ul>/);
  assert.match(home, /<b>2025<\/b><ul class="year-points"><li>Scholar Athlete, DVHS, in February\.<\/li>/);
  assert.equal(/<b>2024–25<\/b>/.test(home), false);
  assert.equal(home.includes("<li>JV Wrestling Most Improved Wrestler.</li><li>Scholar Athlete"), false);
  assert.match(home, /<b>2026<\/b><ul class="year-points">/);
  assert.match(home, /Earned a 1st degree black belt on October 24/);
  assert.match(home, /NPA Local Winner, Elementary/);
  assert.match(home, /JV Wrestling Most Improved Wrestler/);
  assert.match(home, /Scholar Athlete, DVHS, in February/);
  assert.match(home, /Certificate of Merit Level 8, Piano, in February/);
  assert.match(home, /AP Scholar with Distinction in June/);
  assert.match(home, /The flight date is not on file/);
  assert.match(home, /Earned a 2nd degree black belt on April 29, after training since kindergarten/);
  assert.equal(home.includes("Nov 2022"), false);
  assert.match(home, />Piano</);
  for (const chip of ["Python", "Java", "Front-end development", "Game development", "3D printing", "Tutoring", "Orchestra", "Wrestling"]) {
    assert.match(home, new RegExp(">" + chip + "<"));
  }
  for (const name of ["projects.html", "awards.html", "activities.html", "experience.html", "about.html", "contact.html"]) {
    const html = read(name);
    assert.equal(html.includes('class="yc"'), false);
    assert.equal(html.includes("The path so far"), false);
    assert.equal(html.includes('id="timeline"'), false);
  }
});

test("timeline arrows scroll one card and dim at the ends", () => {
  const home = read("index.html");
  const prevAt = home.indexOf('id="timeline-prev"');
  const nextAt = home.indexOf('id="timeline-next"');
  const scrollerAt = home.indexOf('id="timeline"');
  assert.ok(prevAt > 0 && nextAt > prevAt && scrollerAt > nextAt);
  const prev = home.slice(prevAt - 80, home.indexOf("</button>", prevAt));
  const next = home.slice(nextAt - 80, home.indexOf("</button>", nextAt));
  assert.match(prev, /type="button"/);
  assert.match(next, /type="button"/);
  assert.match(prev, /aria-label="Scroll left"/);
  assert.match(next, /aria-label="Scroll right"/);
  assert.match(prev, /<svg/);
  assert.match(next, /<svg/);
  assert.equal(prev.includes("Scroll left<"), false);
  assert.equal(next.includes("Scroll right<"), false);
  assert.match(read("style.css"), /\.tl-arrow \{[\s\S]*min-width: 44px;[\s\S]*min-height: 44px;/);
  assert.match(read("style.css"), /\.tl-arrow:disabled \{[\s\S]*opacity: 0\.35;/);
  const js = read("main.js");
  assert.match(js, /function scrollTimeline\(direction\) \{\s*timeline\.scrollBy\(\{ left: direction \* timelineStep\(\), behavior: motionOn\(\) \? "smooth" : "auto" \}\);/);
  assert.match(js, /timeline\.scrollLeft <= 8/);
  assert.match(js, /timeline\.scrollLeft >= max - 8/);
  assert.match(js, /timelinePrev\.disabled = atStart/);
  assert.match(js, /timelineNext\.disabled = atEnd/);
  assert.match(js, /event\.key === "ArrowRight" \? 1 : -1/);
});

test("experience copy is only on the experience page", () => {
  const html = read("experience.html");
  for (const line of [
    "Math &amp; English Tutor",
    "Best Brains Learning Centers, San Ramon",
    "AI Researcher",
    "Algoverse AI Research Program (remote)",
    "Independent Math Tutor",
    "Seasonal Camp Work",
    "Youth Volunteer &amp; Mentor",
    "RC Puram Government School in Telangana",
    "Podcast Creator &amp; Treasurer",
    "Tutor at Home",
    "I help my younger brother with his schoolwork."
  ]) {
    assert.equal(html.includes(line), true, line);
  }
  assert.equal(read("index.html").includes("Math &amp; English Tutor"), false);
  assert.equal(read("about.html").includes("class=\"xc\""), false);
  const order = [...html.matchAll(/<h3>(?:<a [^>]*>)?([^<]+)/g)].map((match) => match[1]);
  assert.deepEqual(order, [
    "Youth Volunteer &amp; Mentor",
    "Math &amp; English Tutor",
    "Podcast Creator &amp; Treasurer",
    "AI Researcher",
    "Independent Math Tutor",
    "Seasonal Camp Work",
    "Tutor at Home",
  ]);
});

test("about keeps the biography and not the timeline", () => {
  const html = read("about.html");
  assert.match(html, /Coursework/);
  assert.match(html, /AP Physics C: Mechanics/);
  assert.match(html, /Telugu \(elementary\)/);
  assert.match(html, /rhabdomyolysis/);
  assert.equal(html.includes("Graduating DVHS"), false);
});

test("contact links stay on the contact page", () => {
  const contact = read("contact.html");
  assert.match(contact, /class="lede"[\s\S]*<p class="foot-links">[\s\S]*mailto:haureesh@hotmail\.com/);
  assert.equal(contact.slice(contact.indexOf("<footer")).includes("mailto:"), false);
  const headings = [...contact.matchAll(/<h2>([\s\S]*?)<\/h2>/g)];
  assert.equal(headings.length, 1);
  const headingText = headings[0][1].replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  assert.equal(headingText, "Hi, let's chat.");
  assert.match(contact, /<p class="lede">Thanks for visiting\. I am happy to talk about any of these projects or activities\.<\/p>/);
  assert.equal(contact.includes("Say hi"), false);
  assert.equal(contact.includes("contact-note"), false);
  assert.equal(contact.includes("Let's talk"), false);
  assert.equal(contact.includes("rockets"), false);
  assert.match(read("style.css"), /\.contact-lead h2 \{ font-size: clamp\(48px, 7vw, 96px\); line-height: \.95; margin: 0 0 20px; \}/);
  assert.match(contact, /mailto:haureesh@hotmail\.com/);
  assert.match(contact, /https:\/\/www\.linkedin\.com\/in\/haureesh\//);
  assert.match(contact, /https:\/\/github\.com\/haureesh14/);
  for (const name of ["index.html", "projects.html", "awards.html", "activities.html", "experience.html", "about.html", "404.html", ...projectPages, ...activityPages]) {
    const html = read(name);
    assert.equal(html.includes("haureesh@hotmail.com"), false, name);
    assert.equal(html.includes("linkedin.com/in/haureesh"), false, name);
    if (name !== "projects/ai-research.html") assert.equal(html.includes("github.com/haureesh14"), false, name);
    assert.equal(html.includes("foot-links"), false, name);
    assert.match(html, /Contact<\/a>/);
  }
});

test("each project card opens its own page", () => {
  const html = read("projects.html");
  const sections = ["Overview", "My Role", "Technologies/Tools", "Process/Build", "Outcomes/What I Learned", "Photo Gallery"];
  for (const name of projectPages) {
    assert.match(html, new RegExp('href="' + name + '"'));
    const page = read(name);
    assert.match(page, /aria-current="page">Projects/);
    for (const heading of sections) {
      assert.match(page, new RegExp("<h2>" + heading + "</h2>"), name + " " + heading);
    }
    assert.match(page, /Photo gallery list/);
    assert.equal(page.includes("4.0"), false, name);
    assert.equal(/grade point|GPA/i.test(page), false, name);
  }
  assert.match(read("projects/smash.html"), /uc-berkeley-smash-achievement-2025\.jpg/);
  assert.match(read("projects/aerospace-club.html"), /rocket-launch\.jpg/);
  assert.match(read("projects/aerospace-club.html"), /Secretary \/ Vice President since Aug 2025/);
  assert.match(read("projects/aerospace-club.html"), /flew past 500 ft/);
  assert.match(read("projects/aerospace-club.html"), /Build details such as motor class and recovery system are coming soon/);
  assert.equal(read("projects/aerospace-club.html").includes("Not written up yet"), false);
  assert.equal(read("projects/aerospace-club.html").includes("example.jpg"), false);
  assert.equal(read("projects/aerospace-club.html").includes("1000+"), false);
  assert.match(read("projects.html"), /I help lead the club, and I built a model rocket that flew past 500 ft/);
  const researchFacts = read("projects/ai-research.html");
  assert.match(researchFacts, /XSTest/);
  assert.match(researchFacts, /preliminary/);
  assert.match(researchFacts, /has not been submitted/);
  assert.match(researchFacts, /https:\/\/github\.com\/haureesh14\/Algoverse-heia/);
  assert.match(researchFacts, /class="stack-chips"/);
  assert.match(researchFacts, /algoverse-over-refusal-by-language\.png/);
  assert.match(read("projects.html"), /Studying how model safety changes across languages, with a research team\./);
  assert.equal(researchFacts.includes("published"), false);
  assert.equal(/1000\+/.test(read("projects/smash.html")), false);
  assert.match(read("projects/smash.html"), /one of 100 scholars/);
  assert.match(read("projects/robot-arm.html"), /Hugging Face LeRobot/);
  assert.equal(read("projects/aerospace-club.html").includes("Photos coming soon</p>"), false);
  const arm = read("projects/robot-arm.html");
  for (const photo of ["robot-arm-red-yellow-pair.jpg", "robot-arm-yellow-angle-a.jpg", "robot-arm-yellow-angle-b.jpg"]) {
    assert.match(arm, new RegExp(photo));
  }
  assert.equal(arm.includes("Photos coming soon</p>"), false);
  const research = read("projects/ai-research.html");
  assert.match(research, /algoverse-ai-research-logo\.jpg/);
  assert.equal(research.includes("Photos coming soon</p>"), false);
  assert.equal(read("awards.html").includes("algoverse-ai-research-logo.jpg"), false);
  const listing = read("projects.html");
  assert.match(listing, /data-id="aerospace-club"[\s\S]*?assets\/photos\/rocket-launch\.jpg/);
  assert.match(listing, /Aerospace Club &amp; Model Rocket/);
  assert.equal(listing.includes('data-id="model-rocket"'), false);
  assert.equal(listing.includes("projects/model-rocket.html"), false);
  assert.match(listing, /data-id="robot-arm"[\s\S]*?assets\/photos\/robot-arm-red-yellow-pair\.jpg/);
  assert.match(listing, /data-id="ai-research"[\s\S]*?assets\/photos\/algoverse-ai-research-logo\.jpg/);
  assert.match(listing, /data-id="smash"[\s\S]*?assets\/photos\/uc-berkeley-smash-achievement-2025\.jpg/);
  const home = read("index.html");
  assert.match(home, /class="t wide alg media-row"[\s\S]*?algoverse-ai-research-logo\.jpg/);
  assert.match(home, /class="t wide media-row"[\s\S]*?robot-arm-red-yellow-pair\.jpg/);
  assert.match(home, /id="rocket"[\s\S]*?rocket-launch\.jpg/);
  const rocket = home.slice(home.indexOf('id="rocket"'), home.indexOf('class="t wide alg media-row"'));
  const front = rocket.slice(0, rocket.indexOf('id="rocket-back"'));
  const back = rocket.slice(rocket.indexOf('id="rocket-back"'));
  assert.equal(front.includes("rocket-launch.jpg"), false);
  assert.match(back, /class="media-row"[\s\S]*class="spec-photo" src="assets\/photos\/rocket-launch\.jpg"/);
  assert.match(back, /class="media-copy"[\s\S]*View project/);
  assert.equal(front.includes("View project"), false);
  assert.match(home, /href="projects\/aerospace-club\.html"/);
  assert.equal(home.includes("projects/model-rocket.html"), false);
  const stub = read("projects/model-rocket.html");
  assert.match(stub, /http-equiv="refresh" content="0; url=aerospace-club\.html"/);
  assert.match(stub, /rel="canonical" href="https:\/\/haureesh\.vellamsetti\.com\/projects\/aerospace-club\.html"/);
  assert.equal(stub.includes("<h1"), false);
  assert.equal(stub.includes("<main"), false);
  for (const name of pages) {
    assert.equal(read(name).includes("projects/model-rocket.html"), false, name);
  }
});

test("scholar-athlete copy does not include a GPA", () => {
  const html = read("awards.html");
  assert.match(html, /ncs-cif-scholar-athlete-2024-25\.jpg/);
  assert.match(html, /NCS CIF Scholar-Athlete/);
  assert.equal(html.includes("4.0"), false);
  assert.equal(/grade point|GPA/i.test(html), false);
});

test("rotating activity cards stay on top and awards are picture cards", () => {
  const html = read("awards.html");
  const activities = read("activities.html");
  const ring = activities.slice(activities.indexOf('id="ring"'), activities.indexOf("</div>\n      </div>\n      <p class=\"sr\" id=\"ring-status\""));
  const titles = [...ring.matchAll(/<h3>(?:<a [^>]*>)?([^<]+)/g)].map((match) => match[1]);
  assert.deepEqual(titles, ["Orchestra", "Podcast", "Wrestling", "Vibha", "Piano", "Karate"]);
  assert.match(html, /<h1>Awards<span class="dot">\.<\/span><\/h1>/);
  assert.match(activities, /<h1>Activities<span class="dot">\.<\/span><\/h1>/);
  assert.match(activities, /class="ring-gap"/);
  assert.match(html, /location\.hash\.replace\([\s\S]*=== "activities"\) location\.replace\("activities\.html"\)/);
  assert.equal(html.includes('id="ring"'), false);
  assert.equal(html.includes("Certificate scans"), false);
  assert.match(html, /class="certs"/);
  assert.match(html, /Presidential Volunteer Service Award – Silver/);
  assert.equal((html.match(/<b>AP Scholar with Distinction<\/b>/g) || []).length, 1);
  assert.match(html, /AP Scholar with Distinction<\/b><span>College Board · 2026/);
  assert.match(html, /assets\/certificates\/ap-scholar-distinction\.jpg/);
  assert.equal(html.includes("College Board · Jul 2026"), false);
  assert.match(html, /Certificate of Merit – Piano Level 8<\/b><span>MTAC · Feb 2025/);
  assert.equal((html.match(/<b>Scholar Athlete<\/b>/g) || []).length, 1);
  assert.match(html, /Scholar Athlete<\/b><span>Dougherty Valley High School · Feb 2025/);
  assert.match(html, /first-degree-black-belt-certificate-2020-10-24\.jpg/);
  assert.match(html, /1st Degree Black Belt<\/b><span>Ernie Reyes' West Coast World Martial Arts Association · October 24, 2020/);
  assert.match(html, /second-degree-black-belt-certificate-2023-04-29\.jpg/);
  assert.match(html, /2nd Degree Black Belt<\/b><span>Ernie Reyes' West Coast World Martial Arts Association · April 29, 2023/);
  assert.match(html, /martial-arts-1st-place-plaque-undated\.jpg/);
  assert.match(html, /Martial arts 1st Place<\/b><span>Ernie Reyes' World Martial Arts Association · undated/);
  const certOrder = [...html.slice(html.indexOf('class="certs"')).matchAll(/<b>([^<]+)<\/b>/g)].map((match) => match[1]);
  assert.deepEqual(certOrder, [
    "Presidential Volunteer Service Award – Silver",
    "AP Scholar with Distinction",
    "DVHS Varsity Wrestling",
    "NCS CIF Scholar-Athlete",
    "JV Wrestling Most Improved",
    "DVHS Junior Varsity Wrestling",
    "2nd Degree Black Belt",
    "1st Degree Black Belt",
    "Martial arts 1st Place",
    "Silicon Andhra Telugu Pravesam",
    "AP Scholar",
    "Certificate of Merit – Piano Level 8",
    "Scholar Athlete",
  ]);
  assert.match(html, /dvhs-jv-wrestling-most-improved-2024-2025\.jpg/);
  assert.match(html, /JV Wrestling Most Improved<\/b><span>2024/);
  assert.match(html, /NCS CIF Scholar-Athlete<\/b><span>2024/);
  assert.match(html, /DVHS Varsity Wrestling<\/b><span>2024/);
  assert.match(html, /DVHS Junior Varsity Wrestling<\/b><span>2024/);
  assert.match(html, /Course completion · 2016/);
  assert.match(html, /award for 2024–2025/);
  assert.equal(html.includes("DVHS Wrestling · Feb 2025"), false);
  assert.equal(html.includes("Nov 2022"), false);
  assert.equal(html.includes("100+ hours"), false);
  assert.equal(html.includes("Vibha Gold"), false);
  for (const href of ["activities/orchestra.html", "activities/podcasting.html", "activities/vibha.html", "activities/piano.html", "activities/wrestling.html", "activities/karate.html"]) {
    assert.match(activities, new RegExp('href="' + href + '"'));
  }
  assert.equal(activities.includes("activities/best-brains.html"), false);
  assert.match(read("experience.html"), /href="activities\/best-brains\.html">Math &amp; English Tutor/);
  assert.match(ring, /I play cello in the DVHS Chamber Orchestra/);
  assert.match(ring, /I'm treasurer of the Wildcat Way Podcast Club/);
  assert.match(ring, /I wrestle JV and varsity\. JV Most Improved Wrestler, 2024/);
  assert.match(ring, /I mentor younger students through Vibha/);
  assert.match(ring, /Years of piano\. NPA Local Winner, 2017 and 2020–2022, and Certificate of Merit Level 8/);
  assert.match(ring, /Second-degree black belt \(Apr 2023\); I help teach classes at my studio\. 1st place, Ernie Reyes/);
  assert.match(activities, /Haureesh playing cello in the chamber orchestra/);
  assert.match(activities, /Haureesh with his hand raised after a wrestling match/);
  assert.match(activities, /Haureesh volunteering at a Vibha plant nursery/);
  assert.match(activities, /Haureesh playing piano/);
  assert.match(activities, /Haureesh in a guard stance during a group karate drill/);
  assert.equal(activities.includes("orchestra-performance.mp4"), false);
  assert.equal(html.includes("orchestra-performance.mp4"), false);
  assert.equal(html.includes('class="shots"'), false);
  assert.equal(html.includes("outdoor-activity-plant-table.jpg"), false);
  assert.equal(html.includes("DVHS Chamber Orchestra concert"), false);
  const cello = read("activities/orchestra.html");
  const celloStub = read("activities/cello.html");
  assert.match(celloStub, /http-equiv="refresh" content="0; url=orchestra\.html"/);
  assert.match(celloStub, /rel="canonical" href="https:\/\/haureesh\.vellamsetti\.com\/activities\/orchestra\.html"/);
  assert.equal(celloStub.includes("<h1"), false);
  assert.match(cello, /<h1>Orchestra/);
  assert.match(cello, /I play cello in the DVHS Chamber Orchestra/);
  const galleryAt = cello.indexOf('id="gallery"');
  const overviewAt = cello.indexOf('id="overview"');
  assert.ok(overviewAt < galleryAt);
  assert.ok(cello.indexOf("orchestra-concert.jpg") > galleryAt);
  assert.ok(cello.indexOf("orchestra-performance.mp4") > galleryAt);
  assert.match(cello, /Eighth-grade orchestra concert/);
  assert.match(cello, /orchestra-performance\.mp4/);
  assert.match(cello, /muted/);
  assert.equal(cello.includes("autoplay"), false);
  assert.equal(cello.includes('id="video"'), false);
  assert.match(read("activities/vibha.html"), /vibha-plant-nursery\.jpg/);
  assert.match(read("activities/vibha.html"), /vibha-food-bank\.jpg/);
  assert.match(read("activities/vibha.html"), /vibha-group\.jpg/);
  assert.match(read("activities/piano.html"), /piano-trophy-grand-piano\.jpg/);
  const bestBrains = read("activities/best-brains.html");
  assert.match(bestBrains, /assets\/photos\/best-brains-logo\.svg/);
  assert.match(bestBrains, /alt="Best Brains Learning Centers logo"/);
  assert.equal(bestBrains.includes('<p class="empty">Photos coming soon</p>'), false);
  assert.match(read("activities/podcasting.html"), /podcast-cover\.jpg/);
  assert.match(read("activities/podcasting.html"), /The Wildcat Way Podcast cover art/);
  assert.match(read("activities/podcasting.html"), /<figcaption>The Wildcat Way Podcast<\/figcaption>/);
  assert.equal(read("activities/podcasting.html").includes("Photos coming soon"), false);
  assert.equal(read("activities/podcasting.html").includes("example.jpg"), false);
  for (const name of activityPages) {
    const page = read(name);
    const miles = page.indexOf('id="milestones"');
    const gallery = page.indexOf('id="gallery"');
    assert.ok(miles > 0 && miles < gallery, name);
    assert.equal(/<h2>Award<\/h2>/.test(page), name.endsWith("piano.html"), name);
  }
  const piano = read("activities/piano.html");
  assert.ok(piano.indexOf('id="award"') < piano.indexOf('id="milestones"'));
  assert.match(read("about.html"), /first-degree black belt on October 24, 2020/);
  assert.match(read("about.html"), /second-degree black belt on April 29, 2023/);
  assert.equal(read("about.html").includes("Nov 2022"), false);
  const wrestling = read("activities/wrestling.html");
  assert.ok(wrestling.indexOf("dvhs-jv-wrestling-most-improved-2024-2025.jpg") < wrestling.indexOf('id="overview"'));
  assert.ok(wrestling.indexOf('id="award"') < wrestling.indexOf('id="milestones"'));
  assert.ok(wrestling.indexOf("wrestling-xray-image-01.jpg") > wrestling.indexOf('id="gallery"'));
  assert.ok(wrestling.indexOf('id="gallery"') < wrestling.indexOf("dvhs-jv-wrestling-most-improved-2024-2025.jpg", wrestling.indexOf('id="gallery"')));
  assert.match(wrestling, /dvhs-jv-wrestling-2023-24\.jpg/);
  assert.match(wrestling, /dvhs-varsity-wrestling-2024-25\.jpg/);
  const karate = read("activities/karate.html");
  for (const photo of ["first-degree-black-belt-certificate-2020-10-24.jpg", "second-degree-black-belt-certificate-2023-04-29.jpg", "martial-arts-1st-place-plaque-undated.jpg"]) {
    assert.ok(karate.indexOf(photo) > karate.indexOf('id="gallery"'), photo);
  }
  for (const name of activityPages) {
    assert.equal(read(name).includes("outdoor-activity-plant-table.jpg"), false, name);
    assert.equal(read(name).includes("preload=\"none\""), false, name);
    assert.equal(read(name).includes("preload=\"auto\""), false, name);
  }
  assert.match(wrestling, /wrestling-xray-image-01\.jpg/);
  assert.match(wrestling, /wrestling-xray-image-02\.jpg/);
  assert.match(wrestling, /alt="Wrestling — X-ray image"/);
  assert.equal(wrestling.includes("surgery"), false);
  assert.equal(wrestling.includes("fracture"), false);
  assert.equal(wrestling.includes("diagnosis"), false);
  assert.equal(html.includes("wrestling-xray"), false);
  const videos = [
    ["activities/karate.html", "karate-tournament-forms.mp4", "Karate tournament — forms"],
    ["activities/karate.html", "karate-class-kicks.mp4", "Karate class — jumping front kicks"],
    ["activities/karate.html", "karate-form-demo.mp4", "Karate form demonstration"],
    ["activities/karate.html", "karate-group-kickboxing.mp4", "Group kickboxing drill"],
    ["activities/karate.html", "karate-escrima-sticks.mp4", "Escrima stick practice"],
    ["activities/karate.html", "karate-self-defense-practice.mp4", "Self-defense technique practice"],
    ["activities/karate.html", "karate-group-drill.mp4", "Group karate drill"],
    ["activities/orchestra.html", "orchestra-cello-1.mp4", "Chamber orchestra — cello section"],
    ["activities/orchestra.html", "orchestra-cello-2.mp4", "Chamber orchestra performance"],
    ["activities/orchestra.html", "orchestra-gym-performance.mp4", "String orchestra performance at DVHS"],
    ["activities/piano.html", "piano-schumann-melody-home.mp4", "Piano — Schumann, Melody"],
    ["activities/piano.html", "piano-recital.mp4", "Piano recital performance"],
    ["activities/wrestling.html", "wrestling-match-1.mp4", "Wrestling match"],
    ["activities/wrestling.html", "wrestling-match-fremont.mp4", "Wrestling tournament match"]
  ];
  for (const [page, file, caption] of videos) {
    const htmlPage = read(page);
    const at = htmlPage.indexOf(file);
    assert.ok(at > htmlPage.indexOf('id="gallery"'), file);
    const chunk = htmlPage.slice(at - 280, at + 220);
    assert.match(chunk, /<video controls preload="metadata" playsinline /, file);
    assert.match(chunk, /poster="\.\.\/assets\/video\/[^"]+\.jpg"/, file);
    assert.match(htmlPage, new RegExp("<figcaption>" + caption.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "</figcaption>"));
    assert.equal(htmlPage.includes("win"), false, page);
  }
  const wrestlingPage = read("activities/wrestling.html");
  assert.ok(wrestlingPage.indexOf("wrestling-match-1.mp4") < wrestlingPage.indexOf("wrestling-match-fremont.mp4"));
  assert.ok(wrestlingPage.indexOf("wrestling-match-fremont.mp4") < wrestlingPage.indexOf("wrestling-xray-image-01.jpg"));
  const beforeWrestlingLink = activities.slice(Math.max(0, activities.indexOf("activities/wrestling.html") - 500), activities.indexOf("activities/wrestling.html"));
  assert.match(beforeWrestlingLink, /card-wrestling\.jpg/);
  assert.equal(beforeWrestlingLink.includes("xray"), false);
});

test("career wording uses engineer and keeps the majors line", () => {
  const home = read("index.html");
  assert.match(home, /Aspiring Engineer/);
  assert.match(home, /I want to be an engineer/);
  assert.match(home, /next stop, becoming an engineer/);
  assert.equal(home.includes("aerospace engineer"), false);
  assert.equal(home.includes("aerospace engineering"), false);
  assert.match(home, /Physics, Aerospace, Mechanical, CS, Data Science, Electrical/);
  assert.match(read("about.html"), /I want to be an engineer/);
  assert.match(read("about.html"), /Physics, Aerospace, Mechanical, CS, Data Science, and Electrical/);
  assert.match(read("main.js"), /"Engineer", "Rocketry Team", "Researcher", "Black Belt"/);
});

test("the headshot is the real photo on the hero and about portrait", () => {
  for (const name of ["index.html", "about.html"]) {
    const html = read(name);
    assert.match(html, /src="assets\/photos\/haureesh-headshot\.jpg"/);
    assert.match(html, /srcset="assets\/photos\/haureesh-headshot-/);
    assert.match(html, /alt="Haureesh Vellamsetti"/);
    assert.equal(html.includes("assets/photos/headshot.jpg"), false, name);
    assert.equal(html.includes("assets/photos/about-portrait.jpg"), false, name);
  }
});

test("every non-redirect page uses the shared footer", () => {
  assert.deepEqual(footerProblems(), []);
});

test("local links resolve to a page or file", () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const htmlFiles = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  walk(root);
  assert.ok(htmlFiles.includes(resolve(root, "activities.html")));
  assert.ok(htmlFiles.includes(resolve(root, "awards.html")));
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      const path = href.split("#")[0].split("?")[0];
      if (!path) continue;
      const target = path.startsWith("/") ? resolve(root, path.slice(1)) : resolve(dirname(file), path);
      assert.equal(existsSync(target), true, file + " -> " + href);
    }
  }
});

test("old homepage anchors point at the split pages", () => {
  const home = read("index.html");
  assert.match(home, /projects: "projects.html"/);
  assert.match(home, /about: "about.html"/);
  assert.match(home, /projects.html#ai-research/);
  assert.match(home, /projects.html#robot-arm/);
});
