const express = require('express');
const nodemailer = require('nodemailer');
const adminAuth = require('../middleware/adminAuth');
const Message = require('../models/Messages');

const router = express.Router();

const PLACEHOLDER_ENV_VALUES = new Set([
  'your_email@gmail.com',
  'your-gmail@gmail.com',
  'your_16_char_app_password',
  'your-app-password',
  'your-app-password-here',
  'your-password',
  'changeme',
  'replace-me'
]);

function getNormalizedEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isConfiguredEnvValue(value) {
  const normalized = getNormalizedEnvValue(value);
  if (!normalized) {
    return false;
  }

  const lowerCased = normalized.toLowerCase();
  return !PLACEHOLDER_ENV_VALUES.has(lowerCased)
    && !lowerCased.includes('your-app-password')
    && !lowerCased.includes('app-password-here')
    && !lowerCased.includes('your_email')
    && !lowerCased.includes('example.com');
}

function getBooleanEnvValue(value, fallbackValue) {
  const normalized = getNormalizedEnvValue(value).toLowerCase();

  if (!normalized) {
    return fallbackValue;
  }

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallbackValue;
}

function getMailAuthUser() {
  return getNormalizedEnvValue(process.env.SMTP_USER) || getNormalizedEnvValue(process.env.EMAIL_USER);
}

function getMailAuthPass() {
  return getNormalizedEnvValue(process.env.SMTP_PASS) || getNormalizedEnvValue(process.env.EMAIL_PASS);
}

function getMailFromAddress() {
  return getNormalizedEnvValue(process.env.EMAIL_FROM) || getMailAuthUser();
}

function getMailFromHeader() {
  const fromAddress = getMailFromAddress();
  const fromName = getNormalizedEnvValue(process.env.EMAIL_FROM_NAME);

  if (!fromAddress) {
    return '';
  }

  return fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;
}

function getMailMode() {
  if (getNormalizedEnvValue(process.env.SMTP_HOST)) {
    return 'custom-smtp';
  }

  if (getNormalizedEnvValue(process.env.SMTP_SERVICE)) {
    return 'smtp-service';
  }

  return 'gmail';
}

function getMailConfigError() {
  const authUser = getMailAuthUser();
  const authPass = getMailAuthPass();
  const smtpHost = getNormalizedEnvValue(process.env.SMTP_HOST);

  if (!isConfiguredEnvValue(authUser) || !isConfiguredEnvValue(authPass)) {
    return 'Email is not configured on the server. Set EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS to real SMTP credentials.';
  }

  if (process.env.SMTP_PORT && Number.isNaN(Number(process.env.SMTP_PORT))) {
    return 'SMTP_PORT must be a valid number.';
  }

  if (!isConfiguredEnvValue(getMailFromAddress())) {
    return 'Email sender is not configured. Set EMAIL_FROM or EMAIL_USER to a real sender address.';
  }

  if (smtpHost && !getNormalizedEnvValue(process.env.SMTP_SECURE) && !process.env.SMTP_PORT) {
    return 'Custom SMTP requires SMTP_PORT or SMTP_SECURE so the backend can negotiate the connection correctly.';
  }

  return null;
}

function createMailTransport() {
  const configError = getMailConfigError();
  if (configError) {
    const err = new Error(configError);
    err.code = 'EMAIL_CONFIG';
    throw err;
  }

  const smtpHost = getNormalizedEnvValue(process.env.SMTP_HOST);
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const smtpSecure = getBooleanEnvValue(process.env.SMTP_SECURE, !smtpHost);
  const smtpService = getNormalizedEnvValue(process.env.SMTP_SERVICE);
  const authUser = getMailAuthUser();
  const authPass = getMailAuthPass();

  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: authUser,
        pass: authPass
      }
    });
  }

  if (smtpService) {
    return nodemailer.createTransport({
      service: smtpService,
      auth: {
        user: authUser,
        pass: authPass
      }
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: authUser,
      pass: authPass
    }
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMultilineText(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function getSenderName(body) {
  const fullName = `${body.firstName || ''} ${body.lastName || ''}`.trim();
  const fallbackName = getNormalizedEnvValue(body.name);
  return fullName || fallbackName || 'Unknown sender';
}

async function sendMail(options) {
  const transporter = createMailTransport();
  return transporter.sendMail(options);
}

router.get('/mail-status', adminAuth, async (req, res) => {
  const error = getMailConfigError();

  return res.json({
    configured: !error,
    error,
    mode: getMailMode(),
    sender: getMailFromAddress() || null
  });
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const allMessages = await Message.find();
    const messages = (Array.isArray(allMessages) ? allMessages : [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(messages);
  } catch (err) {
    console.error('Error loading messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      name,
      company,
      phone,
      email,
      message,
      privacy
    } = req.body || {};

    const normalizedEmail = getNormalizedEnvValue(email).toLowerCase();
    const normalizedMessage = getNormalizedEnvValue(message);
    const senderName = getSenderName({ firstName, lastName, name });

    if (!normalizedEmail || !normalizedMessage) {
      return res.status(400).json({ message: 'Email and message are required' });
    }

    if (!privacy) {
      return res.status(400).json({ message: 'Privacy agreement required' });
    }

    await Message.create({
      name: senderName,
      firstName: getNormalizedEnvValue(firstName),
      lastName: getNormalizedEnvValue(lastName),
      company: getNormalizedEnvValue(company),
      phone: getNormalizedEnvValue(phone),
      email: normalizedEmail,
      message: normalizedMessage,
      privacy: Boolean(privacy)
    });

    if (!getMailConfigError()) {
      try {
        await sendMail({
          from: getMailFromHeader(),
          to: normalizedEmail,
          subject: 'Thank you for contacting us - VENOMTECH',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Thank You for Your Message</h2>
              <p><strong>Hi ${escapeHtml(senderName)},</strong></p>
              <p>Thank you for reaching out. We have received your message and will get back to you as soon as possible.</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                <h3 style="margin-top: 0; color: #333;">Your Message</h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.5;">${formatMultilineText(normalizedMessage)}</p>
              </div>
              <p>We typically respond within 24-48 hours.</p>
              <p>Best regards,<br>The VENOMTECH Team</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Error sending confirmation email:', emailErr);
      }
    }

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/reply', adminAuth, async (req, res) => {
  try {
    const reply = getNormalizedEnvValue(req.body?.reply);
    if (!reply) {
      return res.status(400).json({ message: 'Reply is required' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const mailConfigError = getMailConfigError();
    if (mailConfigError) {
      return res.status(500).json({ message: mailConfigError });
    }

    try {
      await sendMail({
        from: getMailFromHeader(),
        to: message.email,
        subject: 'Reply to your message - Portfolio Contact',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reply to Your Message</h2>
            <p><strong>Hi ${escapeHtml(message.name || 'there')},</strong></p>
            <p>Thank you for contacting me. Here is my reply:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5;">${formatMultilineText(reply)}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This is in response to your message:</p>
            <blockquote style="margin: 0; padding-left: 16px; border-left: 3px solid #ddd; color: #666;">
              ${formatMultilineText(message.message)}
            </blockquote>
            <p>Best regards,<br>Your Portfolio Admin</p>
          </div>
        `
      });

      await Message.findOneAndUpdate(
        { _id: message._id },
        { $push: { replies: { reply } } },
        { new: true }
      );

      res.json({ message: 'Reply sent and saved successfully' });
    } catch (err) {
      console.error('Error sending reply email:', err);

      if (err.code === 'EAUTH') {
        return res.status(502).json({
          message: 'SMTP authentication failed. Verify the active SMTP credentials, use an app password if required, and confirm the provider allows SMTP access for this account.'
        });
      }

      if (err.code === 'EMAIL_CONFIG') {
        return res.status(500).json({ message: err.message });
      }

      return res.status(502).json({
        message: 'Failed to send email to recipient. Check SMTP settings and logs.'
      });
    }
  } catch (err) {
    console.error('Error saving reply:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
