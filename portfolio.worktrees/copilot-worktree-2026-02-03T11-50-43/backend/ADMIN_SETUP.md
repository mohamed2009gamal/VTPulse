# Admin Account Setup

## Default Sign-In Credentials

After running the setup script, use these credentials to log in:

**Email:** `admin@portfolio.com`  
**Password:** `admin123`

⚠️ **IMPORTANT:** Change the password after first login for security!

## How to Create Admin Account

### Option 1: Using the Setup Script (Recommended)

1. Make sure MongoDB is running
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Run the admin creation script:
   ```bash
   npm run create-admin
   ```
   OR
   ```bash
   node createAdmin.js
   ```

4. The script will create an admin account with the credentials from `.env` file

### Option 2: Using the API Endpoint

You can also create an admin account via API:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portfolio.com",
    "password": "your-secure-password",
    "adminKey": "SUPER_SECRET_KEY"
  }'
```

**Note:** The `adminKey` must match the `ADMIN_KEY` value in your `.env` file.

## Customizing Admin Credentials

Edit the `.env` file in the backend directory:

```env
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

Then run `npm run create-admin` again.

## Login URL

Once the admin account is created, go to:
- **Frontend:** http://localhost:3000/admin
- **Direct:** Navigate to `/admin` route in your React app

## Session Information

- **Session Duration:** 30 minutes
- **Auto-logout:** Session expires automatically after 30 minutes of inactivity
- **Security:** Uses secure HTTP-only cookies

## Troubleshooting

### "Invalid credentials" error
- Make sure you've created the admin account first
- Check that MongoDB is running
- Verify the email and password match what you created

### "Admin already exists" error
- An admin with that email already exists
- Delete the admin from MongoDB Compass if you want to recreate it
- Or use a different email address

### Can't connect to MongoDB
- Make sure MongoDB service is running
- Check `MONGO_URI` in `.env` file
- Run `net start MongoDB` (Windows) or `sudo systemctl start mongod` (Linux)
