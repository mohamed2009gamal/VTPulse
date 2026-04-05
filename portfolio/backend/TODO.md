# Backend TODO List

## 🚀 Critical Fixes (Priority Order)

### 1. **✅ SMTP Email Authentication** 
   - [x] Create .env.example + detailed Gmail app password guide
   - [x] Enhance TODO_EMAIL_SETUP.md with step-by-step instructions
   - [ ] User: Generate app password → update backend/.env → test with `node test-email-config.js`
   - [ ] Verify contact form sends emails (check server logs)

### 2. Database/MongoDB
   - [x] Update backend/index.js: Await connectDB(), add mongoose query timeout options. (Use index.js.updated.js)

### 3. Admin Dashboard
   - [ ] Fix auth middleware
   - [ ] Test message reply functionality

## 🔧 Setup & Testing
- Run `node backend/test-email-config.js` to validate SMTP
- Test contact form: frontend → backend → email delivery
- Restart: `cd backend && npm start`

