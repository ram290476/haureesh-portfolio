export const CHAT = `<div class="portfolio-chat" data-portfolio-chat>
  <link rel="stylesheet" href="/assets/chat/chat.css">
  <button class="chat-launch" type="button" data-chat-open aria-label="Ask about Haureesh’s experience" aria-haspopup="dialog" aria-expanded="false" aria-controls="portfolio-chat-panel" hidden>Ask about Haureesh</button>
  <dialog class="chat-panel" id="portfolio-chat-panel" aria-modal="true" aria-labelledby="portfolio-chat-title" aria-describedby="portfolio-chat-description">
    <div class="chat-heading">
      <div><h2 id="portfolio-chat-title">Ask about Haureesh</h2><p id="portfolio-chat-description">Public portfolio facts · no generative AI</p></div>
      <button class="chat-close" type="button" data-chat-close aria-label="Close portfolio chat">×</button>
    </div>
    <div class="chat-log" data-chat-log role="log" aria-label="Portfolio conversation" aria-live="polite" aria-relevant="additions text" tabindex="0"></div>
    <div class="chat-chips" aria-label="Suggested questions">
      <button type="button" data-chat-question>What projects has he built?</button>
      <button type="button" data-chat-question>Does he work part-time?</button>
      <button type="button" data-chat-question>What awards has he won?</button>
      <button type="button" data-chat-question>What instruments does he play?</button>
    </div>
    <p class="chat-status" data-chat-status role="status"></p>
    <form class="chat-form" aria-label="Ask a portfolio question">
      <label class="sr" for="portfolio-chat-input">Your question about Haureesh’s experience</label>
      <input id="portfolio-chat-input" name="question" type="text" maxlength="500" autocomplete="off" placeholder="Ask about a project or activity…" required>
      <button type="submit" data-chat-send>Send</button>
    </form>
    <p class="chat-note">Answers are curated, not generated. No conversation is saved or sent to an AI service.</p>
  </dialog>
  <script type="module" src="/assets/chat/chat.js"></script>
</div>`;
