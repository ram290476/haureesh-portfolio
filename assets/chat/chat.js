const STOP = new Set('a an and are as at be been by can did do does for from had has have he her him his how i in into is it me my of on or please she show tell that the their them there these they this to us was were what when where which who why will with would you your about since most'.split(' '));
const SYNONYMS = {
  built: 'build', builds: 'build', made: 'build', make: 'build', projects: 'project',
  awards: 'award', recognition: 'award', recognitions: 'award', honors: 'award', achievements: 'award',
  robotic: 'robot', robotics: 'robot', robots: 'robot', instruments: 'instrument',
  technologies: 'technology', tools: 'technology', skills: 'skill',
  tutoring: 'tutor', tutors: 'tutor', teaching: 'teach', teaches: 'teach', teacher: 'teach',
  mentoring: 'mentor', volunteers: 'volunteer', volunteering: 'volunteer',
  podcasting: 'podcast', podcasts: 'podcast', rockets: 'rocket', rocketry: 'rocket',
  programs: 'program', classes: 'course', courses: 'course', coursework: 'course',
  languages: 'language', works: 'work', working: 'work', job: 'work', employment: 'work',
  plays: 'play', playing: 'play', published: 'publication', submitted: 'submission'
};
export function tokenize(text) {
  return (String(text).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) || [])
    .filter(word => !STOP.has(word)).map(word => SYNONYMS[word] || word);
}
const PRIVATE = [
  /\b(?:gpa|sat|act|psat|score|scores|percentile|transcript|grade point)\b/i,
  /\b(?:address|email|e-mail|phone|telephone|contact|zip code|postcode|street)\b/i,
  /\b(?:income|salary|earnings|financial|finances|net worth|bank|wealth|rich|poor|rent|mortgage)\b/i,
  /\b(?:birthdate|birthday|birth date|born|age|medical|surgery|hospital|hospitalized|injury|injuries|rhabdomyolysis|diagnosis|health)\b/i,
  /\b(?:old is he|old is haureesh|where (?:does he|he|does haureesh) (?:live|lives)|home location|broken hand)\b/i,
  /\b(?:school schedule|class schedule|class period|timetable|family details|family members|parents|siblings|brother|sister|friends|classmates)\b/i,
  /\b(?:college|university|colleges)\b.{0,35}\b(?:appl\w*|target\w*|list|dashboard|choice\w*)\b/i,
  /\b(?:apply|applying|applications)\b.{0,30}\b(?:college|university|colleges)\b/i,
  /\b(?:his|academic|school)\b.{0,20}\bgrades?\b|\bwhat grades? (?:did|does)\b/i,
  /\b(?:how much|what)\b.{0,20}\b(?:paid|earn|earns|money|pay)\b/i,
  /\$|\b\d{3}[-. ]\d{3}[-. ]\d{4}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i
];
export function isSensitive(question) { return PRIVATE.some(pattern => pattern.test(question)); }
export const PRIVACY_REPLY = 'I only share public portfolio experience. I can’t provide private academic results, contact details, financial, medical or family information. Try a question about projects, awards, music or volunteering.';
export const UNKNOWN_REPLY = 'I don’t have that info — try the Projects or Awards pages. I only answer from the curated public portfolio sources and won’t guess.';
const SAFE_LINK = /^\/[a-z0-9/-]+\.html(?:#[a-z0-9-]+)?$/;
export function validKnowledge(value) {
  return Array.isArray(value) && value.length > 0 && value.every(entry =>
    entry && ['id', 'topic', 'answer', 'link'].every(key => typeof entry[key] === 'string' && entry[key].length > 0)
    && ['questions', 'tags'].every(key => Array.isArray(entry[key]) && entry[key].length > 0 && entry[key].every(v => typeof v === 'string'))
    && SAFE_LINK.test(entry.link));
}
export function createRetriever(entries) {
  if (!validKnowledge(entries)) throw new Error('Invalid portfolio knowledge base');
  const docs = entries.map(entry => {
    const tokens = tokenize([...entry.questions, ...entry.tags, ...entry.tags, entry.answer].join(' '));
    const counts = new Map();
    for (const word of tokens) counts.set(word, (counts.get(word) || 0) + 1);
    return { entry, counts, length: tokens.length, questions: entry.questions.map(q => new Set(tokenize(q))) };
  });
  const frequencies = new Map();
  for (const doc of docs) for (const word of doc.counts.keys()) frequencies.set(word, (frequencies.get(word) || 0) + 1);
  const average = docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length;
  return question => {
    const words = [...new Set(tokenize(question))];
    if (!words.length) return null;
    const ranked = docs.map(doc => {
      let bm25 = 0, matched = 0;
      for (const word of words) {
        const count = doc.counts.get(word) || 0;
        if (!count) continue;
        matched++;
        const df = frequencies.get(word) || 0;
        const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
        bm25 += idf * count * 2.2 / (count + 1.2 * (0.25 + 0.75 * doc.length / average));
      }
      const questionSimilarity = Math.max(...doc.questions.map(q => {
        const overlap = words.filter(word => q.has(word)).length;
        return 2 * overlap / (words.length + q.size || 1);
      }));
      return { entry: doc.entry, score: bm25 + 6 * questionSimilarity, coverage: matched / words.length, questionSimilarity };
    }).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    // Require broad query coverage and a known question shape; a shared word alone is not a fact.
    if (best.coverage < 0.75 || best.questionSimilarity < 0.5 || best.score < 2.5) return null;
    // One extra qualifier can change the question. Avoid answering partial matches as if confirmed.
    if (words.length > 1 && best.coverage < 1) return null;
    return { answer: best.entry.answer, link: best.entry.link, topic: best.entry.topic, id: best.entry.id };
  };
}
export function replyTo(question, retrieve) {
  if (isSensitive(question)) return { kind: 'privacy', answer: PRIVACY_REPLY };
  if (/^(?:hi|hello|hey|good (?:morning|afternoon|evening))[!.\s]*$/i.test(question.trim()))
    return { kind: 'greeting', answer: 'Hello! Ask me about Haureesh’s projects, work, awards, music or community service. My answers come from a curated public knowledge base, not a generative model.' };
  if (/^(?:thanks|thank you|thank you very much)[!.\s]*$/i.test(question.trim()))
    return { kind: 'greeting', answer: 'You’re welcome! You can explore another project or activity using the suggested questions.' };
  const answer = retrieve(question);
  return answer ? { kind: 'answer', ...answer } : { kind: 'unknown', answer: UNKNOWN_REPLY };
}

if (typeof document !== 'undefined') setupWidget();
function setupWidget() {
  const root = document.querySelector('[data-portfolio-chat]');
  if (!root || root.dataset.chatReady) return;
  root.dataset.chatReady = 'true';
  const launcher = root.querySelector('[data-chat-open]');
  const dialog = root.querySelector('dialog');
  const form = root.querySelector('form');
  const input = root.querySelector('input');
  const log = root.querySelector('[data-chat-log]');
  const status = root.querySelector('[data-chat-status]');
  const send = root.querySelector('[data-chat-send]');
  let pending = null, retrieve = null, busy = false;
  async function load() {
    if (retrieve) return retrieve;
    if (!pending) pending = fetch(new URL('kb.json', import.meta.url), { credentials: 'omit', mode: 'same-origin' })
      .then(response => { if (!response.ok) throw new Error('Knowledge base unavailable'); return response.json(); })
      .then(data => (retrieve = createRetriever(data)))
      .catch(error => { pending = null; throw error; });
    return pending;
  }
  function addMessage(text, who, link) {
    const row = document.createElement('div');
    row.className = `chat-message chat-message--${who}`;
    const label = document.createElement('span');
    label.className = 'chat-speaker';
    label.textContent = who === 'visitor' ? 'You' : 'Portfolio guide';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    row.append(label, paragraph);
    if (link) {
      const more = document.createElement('a');
      more.href = link;
      more.textContent = 'Read more';
      row.append(more);
    } else if (text === UNKNOWN_REPLY) {
      for (const [label, href] of [['Projects', '/projects.html'], ['Awards', '/awards.html']]) {
        const more = document.createElement('a');
        more.textContent = label;
        more.href = href;
        row.append(more);
      }
    }
    log.append(row);
    // Bound memory in a long visit; there is no saved conversation or server logging.
    while (log.children.length > 40) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function close() {
    dialog.close();
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }
  launcher.addEventListener('click', () => {
    if (dialog.open) return;
    dialog.showModal();
    launcher.setAttribute('aria-expanded', 'true');
    input.focus();
    load().catch(() => { status.textContent = 'The guide could not load. Send a question to retry, or visit Projects and Awards.'; });
  });
  root.querySelector('[data-chat-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]')].filter(el => !el.hidden);
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  async function ask(question) {
    const text = question.trim().slice(0, 500);
    if (!text || busy) return;
    busy = true;
    send.disabled = true;
    root.querySelectorAll('[data-chat-question]').forEach(chip => chip.disabled = true);
    addMessage(text, 'visitor');
    input.value = '';
    status.textContent = 'Finding a grounded answer…';
    try {
      // Sensitive questions never enter retrieval, even if the knowledge base is unavailable.
      const answer = isSensitive(text) ? replyTo(text, () => null) : replyTo(text, await load());
      addMessage(answer.answer, 'guide', answer.link);
      status.textContent = '';
    } catch {
      addMessage('The guide could not load right now. Please try again, or visit the Projects and Awards pages.', 'guide');
      status.textContent = 'No answer was guessed.';
    } finally {
      busy = false;
      send.disabled = false;
      root.querySelectorAll('[data-chat-question]').forEach(chip => chip.disabled = false);
      if (dialog.open) input.focus();
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  root.querySelectorAll('[data-chat-question]').forEach(chip => chip.addEventListener('click', () => ask(chip.textContent)));
  addMessage('Hello! I’m a small portfolio guide, not a generative AI. Ask about Haureesh’s projects, work, awards or music. I only use curated public facts.', 'guide');
  launcher.hidden = false;
}
