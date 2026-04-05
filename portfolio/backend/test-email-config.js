require('dotenv').config();

console.log('✅ dotenv loaded');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'MISSING');
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

// Copy functions from messages.js for standalone test
const PLACEHOLDER_ENV_VALUES = new Set([
  'your_email@gmail.com', 'your-gmail@gmail.com', 'your_16_char_app_password',
  'your-app-password', 'your-app-password-here', 'your-password', 'changeme', 'replace-me'
]);

function getNormalizedEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isConfiguredEnvValue(value) {
  const normalized = getNormalizedEnvValue(value);
  if (!normalized) return false;
  const lowerCased = normalized.toLowerCase();
  return !PLACEHOLDER_ENV_VALUES.has(lowerCased)
    && !lowerCased.includes('your-app-password')
    && !lowerCased.includes('app-password-here')
    && !lowerCased.includes('your_email')
    && !lowerCased.includes('example.com');
}

function getMailConfigError() {
  const authUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const authPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  
  if (!isConfiguredEnvValue(authUser) || !isConfiguredEnvValue(authPass)) {
    return '❌ Email not configured. Copy .env.example → .env and add real Gmail app password.';
  }
  return '✅ SMTP READY! Restart server and test contact form.';
}

console.log('isConfigured USER:', isConfiguredEnvValue(process.env.EMAIL_USER));
console.log('isConfigured PASS:', isConfiguredEnvValue(process.env.EMAIL_PASS));
console.log('Config status:', getMailConfigError());

