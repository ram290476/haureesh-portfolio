import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectPages = [
  "projects/aerospace-club.html",
  "projects/model-rocket.html",
  "projects/robot-arm.html",
  "projects/ai-research.html",
  "projects/smash.html"
];
const activityPages = [
  "activities/vibha.html",
  "activities/best-brains.html",
  "activities/piano.html",
  "activities/podcasting.html",
  "activities/cello.html",
  "activities/wrestling.html"
];
const pages = ["index.html", "projects.html", "awards.html", "experience.html", "about.html", "contact.html", "404.html", ...projectPages, ...activityPages];
const nav = ["Home", "Projects", "Awards", "Experience", "About", "Contact"];

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
  assert.equal(home.includes("<b>2022</b>"), false);
  assert.match(home, /<b>2020<\/b><p>Earned a 1st degree black belt on October 24\./);
  assert.match(home, /Earned a 2nd degree black belt on April 29, after training since kindergarten/);
  assert.equal(home.includes("Nov 2022"), false);
  assert.match(home, />Piano</);
  for (const chip of ["Python", "Java", "Front-end development", "Game development", "3D printing", "Tutoring", "Orchestra", "Wrestling"]) {
    assert.match(home, new RegExp(">" + chip + "<"));
  }
  for (const name of ["projects.html", "awards.html", "experience.html", "about.html", "contact.html"]) {
    const html = read(name);
    assert.equal(html.includes('class="yc"'), false);
    assert.equal(html.includes("The path so far"), false);
    assert.equal(html.includes('id="timeline"'), false);
  }
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
  assert.match(contact, /id="contact"/);
  assert.match(contact, /<h2>Hi, let's chat\. Say hi, let's chat\. Thanks for visiting\. I am happy to talk about any of these projects or activities\.<\/h2>/);
  assert.equal(contact.includes("contact-note"), false);
  assert.equal(contact.includes("Let's talk"), false);
  assert.equal(contact.includes("rockets"), false);
  assert.match(read("style.css"), /\.contact-lead h2 \{ font-size: clamp\(48px, 7vw, 96px\); line-height: \.95; margin: 0 0 20px; \}/);
  assert.match(contact, /mailto:haureesh@hotmail\.com/);
  assert.match(contact, /https:\/\/www\.linkedin\.com\/in\/haureesh\//);
  assert.match(contact, /https:\/\/github\.com\/haureesh14/);
  for (const name of ["index.html", "projects.html", "awards.html", "experience.html", "about.html", "404.html", ...projectPages, ...activityPages]) {
    const html = read(name);
    assert.equal(html.includes("haureesh@hotmail.com"), false, name);
    assert.equal(html.includes("linkedin.com/in/haureesh"), false, name);
    assert.equal(html.includes("github.com/haureesh14"), false, name);
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
  assert.match(read("projects/aerospace-club.html"), /Photos coming soon/);
  assert.match(read("projects/model-rocket.html"), /rocket-launch\.jpg/);
  assert.equal(read("projects/model-rocket.html").includes("Photos coming soon</p>"), false);
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
  assert.match(listing, /data-id="aerospace-club"[\s\S]*?assets\/photos\/aerospace-club\.jpg/);
  assert.equal(listing.includes('data-id="aerospace-club"') && listing.slice(listing.indexOf('data-id="aerospace-club"'), listing.indexOf('data-id="model-rocket"')).includes("rocket-launch.jpg"), false);
  assert.match(listing, /data-id="model-rocket"[\s\S]*?assets\/photos\/rocket-launch\.jpg/);
  assert.match(listing, /data-id="robot-arm"[\s\S]*?assets\/photos\/robot-arm-red-yellow-pair\.jpg/);
  assert.match(listing, /data-id="ai-research"[\s\S]*?assets\/photos\/algoverse-ai-research-logo\.jpg/);
  assert.match(listing, /data-id="smash"[\s\S]*?assets\/photos\/uc-berkeley-smash-achievement-2025\.jpg/);
  const home = read("index.html");
  assert.match(home, /class="t wide alg"[\s\S]*?algoverse-ai-research-logo\.jpg/);
  assert.match(home, /class="t wide"[\s\S]*?robot-arm-red-yellow-pair\.jpg/);
  assert.match(home, /id="rocket"[\s\S]*?rocket-launch\.jpg/);
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
  const ring = html.slice(html.indexOf('id="ring"'), html.indexOf("</div>\n      </div>\n      <p class=\"sr\" id=\"ring-status\""));
  const titles = [...ring.matchAll(/<h3>(?:<a [^>]*>)?([^<]+)/g)].map((match) => match[1]);
  assert.deepEqual(titles, ["Cello", "Podcast", "Wrestling", "Best Brains", "Vibha", "Piano"]);
  assert.match(html, /<h3 class="subhead">Awards<\/h3>/);
  assert.equal(html.includes("Certificate scans"), false);
  assert.match(html, /class="certs"/);
  assert.match(html, /Presidential Volunteer Service Award – Silver/);
  assert.match(html, /first-degree-black-belt-certificate-2020-10-24\.jpg/);
  assert.match(html, /1st Degree Black Belt<\/b><span>Ernie Reyes' West Coast World Martial Arts Association · October 24, 2020/);
  assert.match(html, /second-degree-black-belt-certificate-2023-04-29\.jpg/);
  assert.match(html, /2nd Degree Black Belt<\/b><span>Ernie Reyes' West Coast World Martial Arts Association · April 29, 2023/);
  assert.match(html, /martial-arts-1st-place-plaque-undated\.jpg/);
  assert.match(html, /Martial arts 1st Place<\/b><span>Ernie Reyes' World Martial Arts Association · undated/);
  assert.match(html, /dvhs-jv-wrestling-most-improved-2024-2025\.jpg/);
  assert.match(html, /JV Wrestling Most Improved<\/b><span>2024–2025/);
  assert.equal(html.includes("DVHS Wrestling · Feb 2025"), false);
  assert.equal(html.includes("Nov 2022"), false);
  assert.equal(html.includes("100+ hours"), false);
  assert.equal(html.includes("Vibha Gold"), false);
  for (const href of ["activities/cello.html", "activities/podcasting.html", "activities/best-brains.html", "activities/vibha.html", "activities/piano.html", "activities/wrestling.html"]) {
    assert.match(html, new RegExp('href="' + href + '"'));
  }
  assert.match(html, /Eighth-grade orchestra concert/);
  assert.equal(html.includes("orchestra-performance.mp4"), false);
  assert.equal(html.includes('class="shots"'), false);
  assert.equal(html.includes("outdoor-activity-plant-table.jpg"), false);
  assert.equal(html.includes("DVHS Chamber Orchestra concert"), false);
  const cello = read("activities/cello.html");
  const galleryAt = cello.indexOf('id="gallery"');
  const videoAt = cello.indexOf('id="video"');
  const overviewAt = cello.indexOf('id="overview"');
  assert.ok(overviewAt < galleryAt && galleryAt < videoAt);
  assert.match(cello, /Eighth-grade orchestra concert/);
  assert.match(cello, /orchestra-performance\.mp4/);
  assert.match(cello, /muted/);
  assert.equal(cello.includes("autoplay"), false);
  assert.match(read("activities/vibha.html"), /vibha-plant-nursery\.jpg/);
  assert.match(read("activities/vibha.html"), /vibha-food-bank\.jpg/);
  assert.match(read("activities/vibha.html"), /vibha-group\.jpg/);
  assert.match(read("activities/piano.html"), /piano-trophy-grand-piano\.jpg/);
  assert.match(read("activities/best-brains.html"), /Photos coming soon/);
  assert.match(read("activities/podcasting.html"), /Photos coming soon/);
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
  assert.ok(wrestling.indexOf('id="award"') < wrestling.indexOf('id="milestones"'));
  assert.match(wrestling, /wrestling-xray-image-01\.jpg/);
  assert.match(wrestling, /wrestling-xray-image-02\.jpg/);
  assert.match(wrestling, /alt="Wrestling — X-ray image"/);
  assert.equal(wrestling.includes("surgery"), false);
  assert.equal(wrestling.includes("fracture"), false);
  assert.equal(wrestling.includes("diagnosis"), false);
  assert.equal(html.includes("wrestling-xray"), false);
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

test("old homepage anchors point at the split pages", () => {
  const home = read("index.html");
  assert.match(home, /projects: "projects.html"/);
  assert.match(home, /about: "about.html"/);
  assert.match(home, /projects.html#ai-research/);
  assert.match(home, /projects.html#robot-arm/);
});
