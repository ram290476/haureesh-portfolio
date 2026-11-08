import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pages = ["index.html", "projects.html", "awards.html", "experience.html", "about.html", "contact.html", "404.html"];
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

test("old homepage anchors point at the split pages", () => {
  const home = read("index.html");
  assert.match(home, /projects: "projects.html"/);
  assert.match(home, /about: "about.html"/);
  assert.match(home, /projects.html#ai-research/);
  assert.match(home, /projects.html#robot-arm/);
});
