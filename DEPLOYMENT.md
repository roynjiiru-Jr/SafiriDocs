# SafiriDocs Deployment Guide

## 🚀 Quick Start - Push to GitHub

### Step 1: Set Up GitHub Authentication

Before pushing code to GitHub, you need to authorize GitHub access:

1. **Go to the GitHub tab** in your code sandbox interface
2. **Authorize GitHub App** and **GitHub OAuth**
3. **Wait for successful authorization** confirmation

### Step 2: Create GitHub Repository

Option A - From the sandbox (after Step 1):
```bash
# The setup_github_environment tool will be called automatically
# Then create and push to new repo:
cd /home/user/safiridocs
git remote add origin https://github.com/YOUR_USERNAME/safiridocs.git
git branch -M main
git push -u origin main
```

Option B - Manual setup:
1. Go to https://github.com/new
2. Create repository named `safiridocs`
3. Run:
```bash
cd /home/user/safiridocs
git remote add origin https://github.com/YOUR_USERNAME/safiridocs.git
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy to Cloudflare Pages

### Prerequisites
- Cloudflare account (free tier)
- Cloudflare API token

### Step 1: Get Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create token with "Edit Cloudflare Workers" permissions
3. Save the token securely

### Step 2: Set Up Cloudflare Authentication

In your sandbox:
1. **Go to Deploy tab** in the interface
2. **Add your Cloudflare API token**
3. Wait for confirmation

### Step 3: Build and Deploy

```bash
cd /home/user/safiridocs

# Build the project
npm run build

# Deploy to Cloudflare Pages (first time)
npx wrangler pages project create safiridocs --production-branch main

# Deploy
npx wrangler pages deploy dist --project-name safiridocs
```

### Step 4: Set Production Secrets

```bash
# Add Flutterwave API key
npx wrangler pages secret put FLUTTERWAVE_SECRET_KEY --project-name safiridocs
# Enter: 246a61be75ad1154c6a5827b260e860c (or your production key)

# Add JWT secret (generate a strong random string)
npx wrangler pages secret put JWT_SECRET --project-name safiridocs
# Enter: your-secure-random-jwt-secret-min-32-chars
```

### Step 5: Access Your Deployment

Your app will be live at:
- Production: `https://safiridocs.pages.dev`
- API: `https://safiridocs.pages.dev/api`

---

## 🗄️ Database Setup (Production)

Since we're using local D1 in development, for production you'll need to:

### Option 1: Cloudflare D1 (Recommended for Cloudflare Pages)

1. **Create D1 database**:
   ```bash
   npx wrangler d1 create safiridocs-production
   ```

2. **Copy the database ID** from output and update `wrangler.jsonc`:
   ```jsonc
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "safiridocs-production",
         "database_id": "YOUR_DATABASE_ID_HERE"
       }
     ]
   }
   ```

3. **Run migrations**:
   ```bash
   npx wrangler d1 migrations apply safiridocs-production
   ```

4. **Redeploy**:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name safiridocs
   ```

### Option 2: External Database (PostgreSQL via Neon/Supabase)

If you need a relational database with more features:

1. Sign up for [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Create a database
3. Update code to use PostgreSQL client instead of D1
4. Add connection string as secret

---

## 💳 Flutterwave Setup

### Development (Test Mode)

The provided key `246a61be75ad1154c6a5827b260e860c` is for testing.

Test credentials:
- **MPesa**: Use test phone number from Flutterwave dashboard
- **Card**: 
  - Number: 4242 4242 4242 4242
  - Expiry: 12/30
  - CVV: 123

### Production (Live Mode)

1. Complete KYC verification on Flutterwave
2. Get your **live secret key** from dashboard
3. Update production secret:
   ```bash
   npx wrangler pages secret put FLUTTERWAVE_SECRET_KEY --project-name safiridocs
   ```

4. Configure webhooks:
   - URL: `https://safiridocs.pages.dev/api/payments/webhook/flutterwave`
   - Events: `charge.completed`, `transfer.completed`

---

## 🔍 Monitoring & Logs

### View Deployment Logs
```bash
npx wrangler pages deployment list --project-name safiridocs
```

### View Real-time Logs
```bash
npx wrangler pages deployment tail --project-name safiridocs
```

### Check Database
```bash
# Production database
npx wrangler d1 execute safiridocs-production --command="SELECT COUNT(*) FROM users"
```

---

## 📊 Post-Deployment Checklist

- [ ] GitHub repository created and code pushed
- [ ] Cloudflare Pages deployment successful
- [ ] Production secrets configured (Flutterwave, JWT)
- [ ] D1 database created and migrated
- [ ] Test signup/login flow
- [ ] Test payment initiation (test mode)
- [ ] Test complete delivery workflow
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/alerts

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Issues
```bash
# Reset local database
npm run db:reset

# Check migrations
npx wrangler d1 migrations list safiridocs-production
```

### Deployment Fails
```bash
# Check wrangler authentication
npx wrangler whoami

# Re-login if needed
npx wrangler login
```

### API Returns 500
- Check Cloudflare Pages logs
- Verify secrets are set correctly
- Check database connection

---

## 📞 Support

If you encounter issues:
1. Check Cloudflare dashboard for errors
2. Review wrangler logs
3. Verify all secrets are set
4. Test locally first (`npm run dev:sandbox`)

---

## 🎯 Next Steps After Deployment

1. **Test the complete flow** with real users
2. **Monitor metrics** (signups, deliveries, GMV)
3. **Gather feedback** from first 10 users
4. **Iterate** on most painful points
5. **Add features** from roadmap based on user needs

---

**Ready to launch SafiriDocs! 🚀**
