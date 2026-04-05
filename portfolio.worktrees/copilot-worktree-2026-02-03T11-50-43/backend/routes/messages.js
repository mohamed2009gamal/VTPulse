const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const Message = require('../models/Messages');
const nodemailer = require('nodemailer');

// GET all messages (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST message from contact form
router.post('/', async (req, res) => {
  try {
    console.log('Received message request:', req.body);
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      console.log('Validation failed: missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log('Message saved successfully');

    // Send confirmation email to the user (don't fail if email fails)
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Thank you for contacting us - VENOMTECH',
          html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #333;">Thank You for Your Message!</h2><p><strong>Hi ' + name + ',</strong></p><p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p><div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;"><h3 style="margin-top: 0; color: #333;">Your Message:</h3><p style="margin: 0; font-size: 16px; line-height: 1.5;">' + message + '</p></div><p>We typically respond within 24-48 hours. If you have any urgent inquiries, please feel free to contact us directly.</p><p>Best regards,<br>The VENOMTECH Team</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="color: #666; font-size: 12px;">This is an automated confirmation email. Please do not reply to this message.</p></div>'
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', email);
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

// PUT reply to a message (admin only)
router.put('/:id/reply', adminAuth, async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ message: 'Reply is required' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.replies.push({ reply });
    await message.save();

    // Send email to the user
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: message.email,
        subject: 'Reply to your message - Portfolio Contact',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reply to Your Message</h2>
            <p><strong>Hi ${message.name},</strong></p>
            <p>Thank you for contacting me. Here's my reply:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5;">${reply}</p>
            </div>
            <p style="color: #666; font-size: 14px;">This is in response to your message: "${message.message}"</p>
            <p>Best regards,<br>Your Portfolio Admin</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Reply email sent to:', message.email);
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
      // Don't fail the request if email fails, just log it
    }

    res.json({ message: 'Reply added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
