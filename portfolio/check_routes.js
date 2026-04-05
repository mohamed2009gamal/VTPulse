const auth = require('./backend/routes/auth');
console.log('routes:');
auth.stack.forEach(m => {
  if (m.route) {
    console.log(Object.keys(m.route.methods), m.route.path);
  }
});
