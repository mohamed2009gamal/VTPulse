const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const Visit = require('../models/Visit');
const Click = require('../models/Click');
const Cookie = require('../models/CookieConsent');
const Message = require('../models/Messages');

router.get('/overview', adminAuth, async (req, res) => {
  try {
    const visits = await Visit.countDocuments();
    const clicks = await Click.countDocuments();
    const messages = await Message.countDocuments();
    const cookiesAccepted = await Cookie.countDocuments({ status: 'accepted' });

    // Calculate total time spent
    const visitsWithTime = await Visit.find({ timeSpent: { $exists: true, $gt: 0 } });
    const totalTimeSpent = visitsWithTime.reduce((sum, visit) => sum + (visit.timeSpent || 0), 0);

    res.json({
      visits,
      clicks,
      messages,
      cookiesAccepted,
      totalTimeSpent
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

// Get detailed analytics
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const visits = await Visit.find().sort({ createdAt: -1 }).limit(100);
    const clicks = await Click.find().sort({ createdAt: -1 }).limit(100);
    const cookies = await Cookie.find().sort({ createdAt: -1 }).limit(100);
    
    // Group visits by path
    const visitsByPath = {};
    visits.forEach(visit => {
      const path = visit.path || '/';
      if (!visitsByPath[path]) {
        visitsByPath[path] = { count: 0, totalTime: 0 };
      }
      visitsByPath[path].count++;
      visitsByPath[path].totalTime += visit.timeSpent || 0;
    });

    res.json({
      recentVisits: visits.slice(0, 20),
      recentClicks: clicks.slice(0, 20),
      cookieStats: {
        accepted: await Cookie.countDocuments({ status: 'accepted' }),
        rejected: await Cookie.countDocuments({ status: 'rejected' })
      },
      visitsByPath
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
