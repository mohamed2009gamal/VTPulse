module.exports = (req, res, next) => {
  const cookieAuth = req.cookies && req.cookies.adminAuth;
  
  if (!cookieAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Decode session token: format is "adminId:timestamp"
    const decoded = Buffer.from(cookieAuth, 'base64').toString('utf-8');
    const [adminId, loginTime] = decoded.split(':');
    const sessionAge = Date.now() - parseInt(loginTime);
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Check if session expired (30 minutes)
    if (sessionAge > thirtyMinutes) {
      res.clearCookie('adminAuth');
      return res.status(401).json({ error: 'Session expired' });
    }

    // Session is valid, attach adminId to request
    req.adminId = adminId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid session' });
  }
};
