const nodemailer = require("nodemailer");

// Required env vars for real email delivery:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
// Optional:
//   FRONTEND_URL (defaults to http://localhost:5001 because this app serves
//   its static public files through the Express server on port 5001)
//
// If SMTP_HOST isn't set, we don't crash — we log the email to the console
// instead, so the reset flow is testable before real SMTP credentials exist.

let transporter = null;
if (process.env.SMTP_HOST) {
  const host = process.env.SMTP_HOST;
  const rawPort = Number(process.env.SMTP_PORT) || 465;
  const isGmail = /gmail\.com/i.test(host);
  const port = isGmail ? 465 : rawPort;
  const secure = isGmail || rawPort === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  transporter.verify().catch((verifyErr) => {
    console.error("[mailer] SMTP verification failed:", verifyErr.message);
  });
}

async function sendPasswordResetEmail(toEmail, rawToken) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5001";
  const resetLink = `${frontendUrl}/ResetPassword.html?token=${rawToken}`;

  const subject = "Reset your BuilderQueries password";
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;">
      <h2>Reset your password</h2>
      <p>We got a request to reset the password for this email address. This link expires in 30 minutes.</p>
      <p><a href="${resetLink}" style="background:#E8530A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Reset password</a></p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all;">${resetLink}</p>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;

  if (!transporter) {
    console.warn(
      "[mailer] SMTP not configured — printing the reset link instead of emailing it:\n",
      resetLink
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@builderqueries.com",
      to: toEmail,
      subject,
      html
    });
  } catch (err) {
    console.error("[mailer] sendMail failed:", err.message);
    throw err;
  }
}

module.exports = { sendPasswordResetEmail };