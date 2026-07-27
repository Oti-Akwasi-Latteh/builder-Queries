// ═══════════════════════ CONTACT PAGE ═══════════════════════
const API_BASE = "http://localhost:5001";

// Contact.html's button calls sendMessage() — that's the entry point.
async function sendMessage() {
  const name    = document.getElementById('ct-name').value.trim();
  const email   = document.getElementById('ct-email').value.trim();
  const subject = document.getElementById('ct-subject').value;
  const msg     = document.getElementById('ct-msg').value.trim();

  if (!name)                          { showToast('Please enter your name');       return; }
  if (!email || !email.includes('@')) { showToast('Please enter a valid email');   return; }
  if (!subject)                       { showToast('Please select a subject');      return; }
  if (!msg)                           { showToast('Please write a message');       return; }

  const sendBtn = document.querySelector('.btn-send');
  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message: msg })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showToast(data.msg || "Could not send your message. Try again.");
      return;
    }

    // Clear form
    document.getElementById('ct-name').value    = '';
    document.getElementById('ct-email').value   = '';
    document.getElementById('ct-subject').value = '';
    document.getElementById('ct-msg').value     = '';

    showToast('Message sent! We\'ll get back to you shortly.');
  } catch (err) {
    showToast("Can't reach the server right now. Please try again later.");
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Kept as an alias in case any older markup still calls the old name.
const sendContactMessage = sendMessage;
