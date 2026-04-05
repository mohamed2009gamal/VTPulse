const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const Visit = require('../models/Visit');
const Click = require('../models/Click');
const Cookie = require('../models/CookieConsent');
const Message = require('../models/Messages');

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getWindowStart = (windowMs) => new Date(Date.now() - windowMs);
const toArray = (value) => (Array.isArray(value) ? value : []);

router.get('/overview', adminAuth, async (req, res) => {
  try {
    console.log('[dashboard] overview start');
    const todayStart = getTodayStart();
    const activeWindowStart = getWindowStart(5 * 60 * 1000);
    const clicksHourStart = getWindowStart(60 * 60 * 1000);

    const visits = await Visit.countDocuments();
    console.log('[dashboard] overview visits', visits);
    const clicks = await Click.countDocuments();
    console.log('[dashboard] overview clicks', clicks);
    const messages = await Message.countDocuments();
    console.log('[dashboard] overview messages', messages);
    const cookiesAccepted = await Cookie.countDocuments({ status: 'accepted' });
    const cookiesRejected = await Cookie.countDocuments({ status: 'rejected' });
    const visitsWithTime = toArray(await Visit.find({ timeSpent: { $exists: true, $gt: 0 } }));
    const activeVisits = await Visit.countDocuments({ createdAt: { $gte: activeWindowStart } });
    const clicksLastHour = await Click.countDocuments({ createdAt: { $gte: clicksHourStart } });
    const visitsToday = await Visit.countDocuments({ createdAt: { $gte: todayStart } });
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: todayStart } });
    const topPaths = toArray(
      Visit.aggregate
        ? await Visit.aggregate([
            {
              $group: {
                _id: { $ifNull: ['$path', '/'] },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 4 }
          ])
        : []
    );
    const allMessages = toArray(await Message.find({}));
    console.log('[dashboard] overview messages loaded', allMessages.length);

    // Sort and limit messages in JavaScript
    const recentMessages = allMessages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(msg => ({
        firstName: msg.firstName,
        lastName: msg.lastName,
        name: msg.name,
        email: msg.email,
        company: msg.company,
        createdAt: msg.createdAt,
        replies: msg.replies
      }));

    const totalTimeSpent = visitsWithTime.reduce((sum, visit) => sum + (visit.timeSpent || 0), 0);

    res.json({
      visits,
      clicks,
      messages,
      cookiesAccepted,
      cookiesRejected,
      totalTimeSpent,
      live: {
        activeVisits,
        clicksLastHour,
        visitsToday,
        messagesToday
      },
      topPaths: topPaths.map((entry) => ({
        path: entry._id || '/',
        count: entry.count
      })),
      recentMessages,
      lastUpdated: new Date().toISOString()
    });
    console.log('[dashboard] overview response sent');
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const todayStart = getTodayStart();
    const activeWindowStart = getWindowStart(5 * 60 * 1000);
    const clicksHourStart = getWindowStart(60 * 60 * 1000);
    const visits24HourStart = getWindowStart(24 * 60 * 60 * 1000);

    const allVisits = toArray(await Visit.find());
    const allClicks = toArray(await Click.find());
    const allCookies = toArray(await Cookie.find());
    const clicksByElementAgg = toArray(
      Click.aggregate
        ? await Click.aggregate([
            {
              $group: {
                _id: { $ifNull: ['$element', 'unknown'] },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 8 }
          ])
        : []
    );
    const visits24HoursData = toArray(await Visit.find({ createdAt: { $gte: visits24HourStart } }));
    const acceptedCookies = await Cookie.countDocuments({ status: 'accepted' });
    const rejectedCookies = await Cookie.countDocuments({ status: 'rejected' });
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: todayStart } });
    const activeVisits = await Visit.countDocuments({ createdAt: { $gte: activeWindowStart } });
    const clicksLastHour = await Click.countDocuments({ createdAt: { $gte: clicksHourStart } });

    // Sort and limit in JavaScript
    const visits = allVisits
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 200);
    
    const clicks = allClicks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 200);
    
    const recentCookies = allCookies
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    
    const visits24Hours = visits24HoursData
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const visitsByPath = {};
    visits.forEach((visit) => {
      const path = visit.path || '/';
      if (!visitsByPath[path]) {
        visitsByPath[path] = { count: 0, totalTime: 0 };
      }
      visitsByPath[path].count += 1;
      visitsByPath[path].totalTime += visit.timeSpent || 0;
    });

    const visitsByHourMap = {};
    visits24Hours.forEach((visit) => {
      const hour = new Date(visit.createdAt);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      visitsByHourMap[key] = (visitsByHourMap[key] || 0) + 1;
    });

    res.json({
      recentVisits: visits.slice(0, 25),
      recentClicks: clicks.slice(0, 25),
      recentCookies,
      cookieStats: {
        accepted: acceptedCookies,
        rejected: rejectedCookies
      },
      visitsByPath,
      visitsByHour: Object.entries(visitsByHourMap).map(([hour, count]) => ({
        hour,
        count
      })),
      clicksByElement: clicksByElementAgg.map((entry) => ({
        element: entry._id || 'unknown',
        count: entry.count
      })),
      summary: {
        activeVisits,
        clicksLastHour,
        messagesToday,
        trackedPages: Object.keys(visitsByPath).length
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
