# 🎉 SafiriDocs is LIVE in Sandbox!

## ✅ Your App is Running!

**Public URL**: https://3000-i4epu0g96juip1tovetz3-b32ec7bb.sandbox.novita.ai

**API Health Check**: https://3000-i4epu0g96juip1tovetz3-b32ec7bb.sandbox.novita.ai/api/health

---

## 🧪 Test Your App Right Now!

### Test Accounts (Already Loaded)

1. **Sender**: 
   - Email: `alice@example.com`
   - Password: `password123`

2. **Traveler**:
   - Email: `bob@example.com`
   - Password: `password123`

3. **Both Roles**:
   - Email: `carol@example.com`
   - Password: `password123`

4. **Admin**:
   - Email: `admin@safiridocs.com`
   - Password: `password123`

### Try These Features

1. **Open the URL** in your browser
2. **Click "Sign Up"** or **"Login"** 
3. **Login as Alice** (sender) and create a delivery request
4. **Login as Bob** (traveler) in another tab and add a trip
5. **Test the matching system** by applying to requests

---

## 📡 API Endpoints You Can Test

```bash
# Health check
curl https://3000-i4epu0g96juip1tovetz3-b32ec7bb.sandbox.novita.ai/api/health

# Login
curl -X POST https://3000-i4epu0g96juip1tovetz3-b32ec7bb.sandbox.novita.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Get current user (replace TOKEN with JWT from login response)
curl https://3000-i4epu0g96juip1tovetz3-b32ec7bb.sandbox.novita.ai/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔑 Cloudflare API Token Creation Guide

### Step-by-Step Instructions

#### **Step 1: Go to Cloudflare Dashboard**
1. Open: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"** (blue button)

#### **Step 2: Choose Template**
- **Option A**: Use **"Edit Cloudflare Workers"** template (quickest)
- **Option B**: Create **Custom Token** (more control)

#### **Step 3: Configure Permissions**

For SafiriDocs, you need these permissions:

**Account Permissions:**
- ✅ `Cloudflare Pages` → **Edit**
- ✅ `Workers Scripts` → **Edit**
- ✅ `D1` → **Edit** (for database)

**Zone Permissions** (if using custom domain):
- ✅ `Zone` → **Read**
- ✅ `DNS` → **Edit**

#### **Step 4: Set Resources**

**Account Resources:**
- Select: **All accounts** or **Specific account**
- Choose: Your account (roynjiiru@gmail.com)

**Zone Resources:**
- Select: **All zones** or **Specific zones**

#### **Step 5: Set Client IP Filtering (Optional)**
- Leave blank for **any IP address**
- Or restrict to **your IP** for security

#### **Step 6: Set TTL (Token Lifetime)**
- Choose: **Custom TTL** or **Forever**
- Recommended: **1 year** (you can regenerate later)

#### **Step 7: Create Token**
1. Click **"Continue to summary"**
2. Review permissions
3. Click **"Create Token"**

#### **Step 8: Copy Your Token**
⚠️ **IMPORTANT**: Copy the token NOW! You won't see it again!

**Your token will look like:**
```
aBcD1234EfGh5678IjKl9012MnOp3456QrSt7890
```

---

## 🚀 Use Your Token

### Option 1: Quick Deploy (One-time)
```bash
cd /home/user/safiridocs

# Set token as environment variable
export CLOUDFLARE_API_TOKEN=your_token_here

# Deploy
npm run build
npx wrangler pages deploy dist --project-name safiridocs
```

### Option 2: Save Token (Persistent)
```bash
# Login with wrangler
npx wrangler login

# Or set in environment
echo 'export CLOUDFLARE_API_TOKEN=your_token_here' >> ~/.bashrc
source ~/.bashrc
```

---

## 🔒 Token Security Best Practices

### ✅ DO:
- Store token in **password manager**
- Use **separate tokens** for dev/prod
- **Rotate tokens** every 6-12 months
- **Delete unused tokens** immediately
- Keep tokens in **environment variables** (never in code)

### ❌ DON'T:
- Commit tokens to git (already in `.gitignore`)
- Share tokens via email/chat
- Use same token for multiple projects
- Leave tokens in plain text files

---

## 🎯 What Token Does for SafiriDocs

Your token allows `wrangler` to:
1. ✅ Create Cloudflare Pages project
2. ✅ Deploy your built application
3. ✅ Create D1 database (if using)
4. ✅ Set environment variables (secrets)
5. ✅ View deployment logs

**It does NOT affect your existing "Edit Cloudflare Workers" token!**

---

## 📊 Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare API Token Page                      │
│                                                             │
│  Token name           Permissions        Resources  Status  │
│  ────────────────────────────────────────────────────────   │
│  Edit Cloudflare      Account.Workers    All zones  Active  │
│  Workers              Agents Config                          │
│                                                             │
│                    [+ Create Token]  ← CLICK HERE          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Create API Token                               │
│                                                             │
│  ○ Use template: Edit Cloudflare Workers                   │
│  ● Create Custom Token  ← SELECT THIS                      │
│                                                             │
│  Token name: SafiriDocs Deployment                         │
│                                                             │
│  Permissions:                                              │
│  Account ► Cloudflare Pages ► Edit ✓                      │
│  Account ► Workers Scripts ► Edit ✓                       │
│  Account ► D1 ► Edit ✓                                    │
│                                                             │
│  Account Resources: All accounts ✓                         │
│  Zone Resources: All zones ✓                               │
│                                                             │
│  TTL: 1 year                                               │
│                                                             │
│              [Continue to summary]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Token Created Successfully!                    │
│                                                             │
│  ⚠️  Copy this token now - you won't see it again!         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ aBcD1234EfGh5678IjKl9012MnOp3456QrSt7890uvWxYz       │ │
│  │                                        [Copy] ← CLICK  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Sandbox Lifetime

**Important**: This sandbox URL is temporary and will expire in **1 hour**.

**For Permanent Deployment:**
1. Create Cloudflare token (follow guide above)
2. Deploy to Cloudflare Pages (see DEPLOYMENT.md)
3. Your app will be at: `https://safiridocs.pages.dev`

---

## 🆘 Need Help?

### Sandbox Issues
```bash
# Check logs
cd /home/user/safiridocs
pm2 logs safiridocs --nostream

# Restart service
pm2 restart safiridocs

# Check status
pm2 status
```

### Token Issues
- **Can't find page**: Make sure you're logged into Cloudflare
- **No create button**: Check account permissions
- **Token not working**: Verify permissions include Pages + Workers

---

## 🎉 Next Steps

1. ✅ **Test the app NOW** → https://3000-i4epu0g96juip1tovetz3-b32ec7bb.sandbox.novita.ai
2. 📝 **Create Cloudflare token** (follow guide above)
3. 🚀 **Deploy to production** (see DEPLOYMENT.md)
4. 📱 **Share with users** and get feedback!

---

**Your SafiriDocs MVP is LIVE and ready to test! 🚀**
