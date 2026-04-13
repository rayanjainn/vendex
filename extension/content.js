// Vendex Chat Extension
// Triggered when URL contains #vendex-chat
// Only clicks "Chat Now" button, then pre-fills a smart inquiry message based on product context.
// Does NOT auto-send — the user reviews and sends manually.

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Parse product context from hash: #vendex-chat:{"title":...,"moq":...,"ranking":...}
function parseContext() {
  const hash = location.hash || '';
  const prefix = '#vendex-chat:';
  if (!hash.startsWith(prefix)) return null;
  try {
    return JSON.parse(decodeURIComponent(hash.slice(prefix.length)));
  } catch (e) {
    return null;
  }
}

// Build a smart inquiry message from product context + seller's auto-reply text
function buildMessage(ctx, sellerAutoReply) {
  const productName = ctx?.title || document.querySelector('h1')?.textContent?.trim() || 'this product';
  const moq = ctx?.moq || null;
  const ranking = ctx?.ranking || '';

  // Analyse the seller's auto-reply to avoid asking questions they already answered
  const alreadyMentions = (keyword) => sellerAutoReply
    ? sellerAutoReply.toLowerCase().includes(keyword.toLowerCase())
    : false;

  const questions = [];

  if (!alreadyMentions('customiz') && !alreadyMentions('logo') && !alreadyMentions('branding')) {
    questions.push('What customization options are available (logo, color, packaging)?');
  }
  if (!alreadyMentions('lead time') && !alreadyMentions('production time')) {
    questions.push('What is the production lead time for an initial order?');
  }
  if (!alreadyMentions('sample')) {
    questions.push('Can you send a sample before bulk order, and what is the sample cost?');
  }
  if (!alreadyMentions('certif') && !alreadyMentions('ce') && !alreadyMentions('fcc')) {
    questions.push('Do you have any quality certifications (CE, ISO, etc.)?');
  }

  const moqLine = moq && moq > 1
    ? `I'm looking to order around ${moq}+ units initially.`
    : "I'm interested in placing a bulk order.";

  const rankLine = ranking ? ` I noticed this is ${ranking} — great!` : '';

  return `Hi,\n\nI'm interested in "${productName}".${rankLine} ${moqLine}\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nLooking forward to your reply.`;
}

// Detect the seller's auto-reply text from the chat panel
async function getSellerAutoReply(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(400);
    // Common selectors for chat message bubbles from the seller
    const msgSelectors = [
      '.message-list .message-item:first-child .message-content',
      '[class*="messageItem"]:first-child [class*="content"]',
      '[class*="chatMessage"]:first-child [class*="text"]',
      '[class*="msg-content"]',
      '[class*="auto-reply"]',
      '[class*="autoReply"]',
    ];
    for (const sel of msgSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.textContent || '').trim();
        if (text.length > 20) return text;
      }
    }
    // Broader fallback: first visible text bubble that looks like a message
    const bubbles = Array.from(document.querySelectorAll('[class*="bubble"], [class*="message"], [class*="msg"]'))
      .filter(el => el.offsetParent !== null);
    for (const b of bubbles) {
      const text = (b.textContent || '').trim();
      if (text.length > 30 && text.length < 2000) return text;
    }
  }
  return '';
}

async function fillMessage(ctx) {
  // Wait up to 10s for the chat textarea to appear
  for (let i = 0; i < 20; i++) {
    await sleep(500);

    const textareaSelectors = [
      'textarea[data-testid="message-input"]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="type" i]',
      'textarea[placeholder*="write" i]',
      '.message-input textarea',
      '.chat-input textarea',
      '.inquiry-form textarea',
      '[class*="messageInput"] textarea',
      '[class*="chatInput"] textarea',
      '[class*="inputArea"] textarea',
      'textarea',
    ];

    let textarea = null;
    for (const sel of textareaSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        textarea = el;
        break;
      }
    }

    if (!textarea) continue;

    // Wait a bit to let seller auto-reply load
    await sleep(1200);
    const autoReply = await getSellerAutoReply(3000);
    console.log('[Vendex] Seller auto-reply detected:', autoReply ? autoReply.slice(0, 80) + '...' : 'none');

    const message = buildMessage(ctx, autoReply);

    // Set value using native setter (works with React-controlled textareas)
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeSetter.call(textarea, message);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();

    console.log('[Vendex] Message pre-filled. Review and press Send when ready.');
    return true;
  }

  console.log('[Vendex] Could not find chat textarea.');
  return false;
}

async function clickChatNow() {
  // ONLY click "Chat Now" — not "Send Inquiry" or "Contact Supplier"
  const chatNowTexts = ['chat now', 'chat'];

  // Try data-testid first
  const testIds = ['chat-now-btn', 'chat-now', 'chatnow'];
  for (const id of testIds) {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (el && el.offsetParent !== null) { el.click(); return true; }
  }

  // Text match — exact "Chat Now" only
  const els = Array.from(document.querySelectorAll('button, a, [role="button"]')).filter(el => {
    const t = (el.textContent || '').trim().toLowerCase();
    return chatNowTexts.includes(t) && el.offsetParent !== null;
  });
  if (els.length > 0) { els[0].click(); return true; }

  return false;
}

async function run() {
  const hash = location.hash || '';
  if (!hash.startsWith('#vendex-chat')) return;

  console.log('[Vendex] Triggered. Waiting for page to settle...');
  await sleep(2000);

  const ctx = parseContext();

  // Try clicking "Chat Now" up to 8 times (page may still be loading)
  let clicked = false;
  for (let i = 0; i < 8; i++) {
    clicked = await clickChatNow();
    if (clicked) break;
    await sleep(1000);
  }

  if (!clicked) {
    console.log('[Vendex] Could not find "Chat Now" button.');
    return;
  }

  console.log('[Vendex] Clicked Chat Now. Waiting for panel...');
  await fillMessage(ctx);
}

run();
window.addEventListener('hashchange', () => run());
