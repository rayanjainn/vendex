// Vendex Chat Extension
// Triggered when URL contains #vendex-chat
// Auto-clicks "Contact Supplier" and sends a default message

const DEFAULT_MESSAGE = "Hi, I'm interested in this product. Could you please share your best price for bulk orders, available customization options, and lead time? Thank you!";

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function tryClickContactButton() {
  // Selectors for the "Contact Supplier" / "Chat Now" button on Alibaba product pages
  const selectors = [
    'button[data-testid="contact-supplier-btn"]',
    'a[data-testid="contact-supplier-btn"]',
    '[data-testid="contact-supplier"]',
    'button.contact-supplier',
    'a.contact-supplier',
    // Text-based fallbacks
    ...Array.from(document.querySelectorAll('button, a')).filter(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return t === 'contact supplier' || t === 'chat now' || t === 'contact now' || t === 'send inquiry';
    }),
  ];

  // Try data-testid selectors first
  const testIdSelectors = selectors.slice(0, 4);
  for (const sel of testIdSelectors) {
    if (typeof sel === 'string') {
      const el = document.querySelector(sel);
      if (el) { el.click(); return true; }
    }
  }

  // Try text-based elements
  const els = Array.from(document.querySelectorAll('button, a')).filter(el => {
    const t = (el.textContent || '').trim().toLowerCase();
    return t === 'contact supplier' || t === 'chat now' || t === 'contact now' || t === 'send inquiry';
  });
  if (els.length > 0) { els[0].click(); return true; }

  return false;
}

async function tryFillAndSendMessage() {
  // Wait up to 8s for the chat panel / modal to appear
  for (let i = 0; i < 16; i++) {
    await sleep(500);

    // Common chat textarea selectors in Alibaba's contact modal / chat panel
    const textareaSelectors = [
      'textarea[data-testid="message-input"]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="type" i]',
      '.message-input textarea',
      '.chat-input textarea',
      '.inquiry-form textarea',
      '[class*="messageInput"] textarea',
      '[class*="chat"] textarea',
      '[class*="inquiry"] textarea',
      'textarea',
    ];

    let textarea = null;
    for (const sel of textareaSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { // visible
        textarea = el;
        break;
      }
    }

    if (!textarea) continue;

    // Fill the message using native input value setter (React-compatible)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(textarea, DEFAULT_MESSAGE);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();

    await sleep(400);

    // Find and click the Send button
    const sendSelectors = [
      'button[data-testid="send-btn"]',
      'button[data-testid="submit-btn"]',
      'button[type="submit"]',
    ];

    let sent = false;
    for (const sel of sendSelectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null && !btn.disabled) {
        btn.click();
        sent = true;
        break;
      }
    }

    // Fallback: find visible Send button by text
    if (!sent) {
      const btns = Array.from(document.querySelectorAll('button')).filter(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        return (t === 'send' || t === 'send message' || t === 'submit') && el.offsetParent !== null && !el.disabled;
      });
      if (btns.length > 0) { btns[0].click(); sent = true; }
    }

    if (sent) {
      console.log('[Vendex] Message sent!');
    } else {
      console.log('[Vendex] Chat opened, message pre-filled. Click Send to send.');
    }
    return;
  }

  console.log('[Vendex] Could not find chat textarea after waiting.');
}

async function run() {
  if (!location.hash.includes('vendex-chat')) return;

  console.log('[Vendex] Chat trigger detected, waiting for page...');

  // Wait for page to be interactive
  await sleep(1500);

  // Try clicking contact button, retry a few times
  let clicked = false;
  for (let i = 0; i < 6; i++) {
    clicked = await tryClickContactButton();
    if (clicked) break;
    await sleep(1000);
  }

  if (!clicked) {
    console.log('[Vendex] Could not find Contact Supplier button.');
    return;
  }

  console.log('[Vendex] Clicked Contact Supplier, waiting for chat panel...');
  await tryFillAndSendMessage();
}

// Run on initial load
run();

// Also handle SPA navigation (hash changes)
window.addEventListener('hashchange', () => run());
