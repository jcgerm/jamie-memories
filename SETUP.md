# Remembering Jamie — Setup Guide

Built with React, Supabase, Cloudflare Stream, and Cloudflare Pages.

---

## Stack

| Service | Purpose | Cost |
|---|---|---|
| Cloudflare Pages | Hosting + serverless functions | Free |
| Supabase | Database + photo storage | Free tier |
| Cloudflare Stream | Video upload + playback | $5/month |
| Cloudflare Registrar | Domain | ~$10/year |

Total: ~$5/month ($60/year) plus domain.

---

## Step 1 — Supabase (database + photo storage)

1. Go to supabase.com and create a free account.
2. Click New project. Name it remembering-jamie. Choose US East region. Set a database password and save it.
3. Wait ~2 minutes for the project to spin up.

### Create the database table

4. Go to Database > SQL Editor > New Query.
5. Paste the entire contents of supabase-schema.sql and click Run.

### Add the prompt column (if upgrading from a previous version)

If you already have a submissions table, run this separately:

  alter table submissions add column if not exists prompt text;

### Create the photo storage bucket

6. Go to Storage > New bucket.
7. Name it exactly: memories-photos
8. Toggle Public bucket to ON.
9. Click Save.

### Get your API keys

10. Go to Project Settings > API.
11. Copy:
    - Project URL — used for both VITE_SUPABASE_URL and SUPABASE_URL
    - service_role secret — used for SUPABASE_SERVICE_ROLE_KEY

---

## Step 2 — Cloudflare Stream (video)

Skip if you only want link-based video. The app still works without it.

1. In your Cloudflare dashboard, click Stream in the left sidebar. Enable it and add a payment method ($5/month, only billed if you use it).
2. Your Account ID is in the right sidebar of any Cloudflare dashboard page.

### Create a Stream API token

3. Click your profile icon > My Profile > API Tokens > Create Token.
4. Click Get started next to Create Custom Token.
5. Name it remembering-jamie-stream.
6. Permissions: Account > Cloudflare Stream > Edit.
7. Account Resources: Include > your account.
8. Click Continue to Summary > Create Token.
9. Copy the token immediately — Cloudflare only shows it once.

---

## Step 3 — Cloudflare Pages (hosting)

### Push to GitHub

1. Create a new GitHub repository (can be private).
2. In your project folder run:

  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/yourusername/remembering-jamie.git
  git push -u origin main

### Connect to Cloudflare Pages

3. In Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git.
4. Select your GitHub repo.
5. Build settings:
   - Framework preset: None
   - Build command: npm run build
   - Build output directory: dist
6. Click Save and Deploy.

### Set environment variables

7. Go to your Pages project > Settings > Environment Variables.
8. Add these under Production:

  VITE_SUPABASE_URL        — Your Supabase project URL
  VITE_ADMIN_PASSWORD      — A strong password for admin access
  SUPABASE_URL             — Same as VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY — Your Supabase service_role key
  CF_ACCOUNT_ID            — Your Cloudflare account ID
  CF_STREAM_TOKEN          — Your Cloudflare Stream API token
  ADMIN_PASSWORD           — Same as VITE_ADMIN_PASSWORD

9. After adding variables, go to Deployments > Retry deployment.

### Connect your domain

10. Go to Pages project > Custom domains > Set up a custom domain.
11. Enter rememberingjamie.com and follow the prompts.
12. Since your domain is also on Cloudflare, DNS configures automatically.
13. SSL is automatic.

---

## Step 4 — Local development (optional)

  npm install
  cp .env.example .env.local
  # fill in .env.local with your values
  npm run dev

App: http://localhost:5173
Admin: http://localhost:5173/admin

---

## Pages

  /memories   Public gallery — all approved submissions
  /submit     Submission form
  /kids       Unlisted — for Maya and Sadie when they are ready
  /admin      Admin review — your cousin only

---

## Admin usage

Go to rememberingjamie.com/admin and log in with your VITE_ADMIN_PASSWORD.

- Pending tab — new submissions to review
- Click any submission to read the memory, view photos and videos
- Approve publishes it to the gallery
- Delete removes it permanently
- Check multiple submissions and use Delete N to bulk delete

---

## Capacity

  Photos    1GB Supabase free       ~2,000 compressed photos
  Videos    1,000 min Stream        ~500 avg 2-min clips ($5/mo)
  Text      500MB database          Effectively unlimited
  Hosting   Cloudflare Pages free   No limits
