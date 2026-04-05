# Google OAuth - ✅ CONFIGURED

**Status:** Google OAuth credentials added to `.env`. Strategy will register on server start.

**Next Required Steps (USER ACTION):**
1. **CRITICAL:** Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Select your OAuth 2.0 Client ID (`314933660223-5pnk4u0c90pfo8drhfc3g0fjkc2dmpvj`)
   - Add this exact URL to **Authorized redirect URIs**:
     ```
     http://localhost:4000/api/auth/google/callback
     ```
   - Save.

2. Restart backend: `cd backend && npm start` (or use VSCode terminal)

3. Test: `curl http://localhost:4000/api/auth/providers` → should show `{google: true}`

4. Create Admin account if needed: `node createAdmin.js`
   - Then login to dashboard → Settings → enable `googleAllowed` for your email.

**Expected Flow:**
```
Frontend → http://localhost:4000/api/auth/google
→ Google consent → callback → dashboard
```

**If still fails:** Check server logs for strategy registration (`✓ Google OAuth strategy registered`).
