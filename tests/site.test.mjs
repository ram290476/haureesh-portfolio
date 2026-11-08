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
const pages = ["index.html", "projects.html", "awards.html", "experience.html", "about.html", "contact.html", "404.html", ...projectPages];
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
  for (const year of ["2022", "2023", "2024", "2025", "2026", "2027"]) {
    assert.match(home, new RegExp("<b>" + year + "</b>"));
  }
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
  assert.match(contact, /Let's talk/);
  assert.match(contact, /mailto:haureesh@hotmail\.com/);
  assert.match(contact, /https:\/\/www\.linkedin\.com\/in\/haureesh\//);
  assert.match(contact, /https:\/\/github\.com\/haureesh14/);
  for (const name of ["index.html", "projects.html", "awards.html", "experience.html", "about.html", "404.html", ...projectPages]) {
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
  for (const name of ["projects/aerospace-club.html", "projects/model-rocket.html", "projects/robot-arm.html", "projects/ai-research.html"]) {
    assert.match(read(name), /Photos coming soon/);
  }
});

test("scholar-athlete copy does not include a GPA", () => {
  const html = read("awards.html");
  assert.match(html, /ncs-cif-scholar-athlete-2024-25\.jpg/);
  assert.equal(html.includes("4.0"), false);
  assert.equal(/grade point|GPA/i.test(html), false);
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
