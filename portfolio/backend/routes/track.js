const router = require('express').Router();
const Visit = require('../models/Visit');
const Click = require('../models/Click');
const Cookie = require('../models/CookieConsent');

router.post('/visit', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const visit = await Visit.create({
      path: req.body.path || '/',
      ip: ip,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });
    res.json({ ok: true, visitId: visit._id });
  } catch (err) {
    console.error('Visit tracking error:', err);
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

router.post('/time', async (req, res) => {
  try {
    const update = { $inc: { timeSpent: req.body.timeSpent || 0 } };
    const query = req.body.visitId
      ? { _id: req.body.visitId }
      : { path: req.body.path || '/' };

    await Visit.findOneAndUpdate(query, update, {
      sort: { createdAt: -1 },
      upsert: !req.body.visitId,
      new: true
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Time tracking error:', err);
    res.status(500).json({ error: 'Failed to track time' });
  }
});

router.post('/click', async (req, res) => {
  try {
    await Click.create({
      element: req.body.element || 'unknown',
      path: req.body.path || '/'
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Click tracking error:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

router.post('/cookie', async (req, res) => {
  try {
    await Cookie.create({
      status: req.body.status || 'unknown'
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Cookie tracking error:', err);
    res.status(500).json({ error: 'Failed to track cookie' });
  }
});

module.exports = router;
