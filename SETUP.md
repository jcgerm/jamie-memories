# Jamie Memories — Setup Guide

A memorial submission and archive app. Contributors submit photos, videos, and written memories.
Your cousin reviews and approves each one before it's saved. Built with React, Supabase, Cloudflare Stream, and Netlify.

---

## Overview of the stack

| Service | What it does | Cost |
|---|---|---|
| **Netlify** | Hosts the website + serverless function | Free |
| **Supabase** | Database (submissions) + Photo storage | Free tier |
| **Cloudflare Stream** | Video upload + playback | $5/month |

Total cost: ~$5/month, or free if you skip direct video upload and use link-only.

---

## Step 1 — Supabase (database + photo storage)

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New project**. Name it `jamie-memories`. Choose a region close to you (US East is fine). Set a database password and save it somewhere.
3. Wait ~2 minutes for the project to spin up.

### Create the database table

4. In the left sidebar, go to **Database > SQL Editor > New Query**.
5. Paste the entire contents of `supabase-schema.sql` and click **Run**.

### Create the photo storage bucket

6. In the left sidebar, go to **Storage**.
7. Click **New bucket**.
8. Name it exactly: `memories-photos`
9. Toggle **Public bucket** to ON.
10. Click **Save**.

### Get your API keys

11. Go to **Project Settings > API** (gear icon in sidebar).
12. Copy:
    - **Project URL** → this is your `VITE_SUPABASE_URL`
    - **anon public** key → this is your `VITE_SUPABASE_ANON_KEY`

---

## Step 2 — Cloudflare Stream (video)

*Skip this step if you want link-only video (no direct upload). The app works without it.*

1. Go to [cloudflare.com](https://cloudflare.com) and create a free account (the base account is free; Stream is $5/month and billed only when you enable it).
2. In the dashboard, go to **Stream** in the left sidebar. You may need to enable it and add a payment method.
3. Note your **Account ID** — it's in the right sidebar on any Cloudflare dashboard page. This is your `VITE_CF_ACCOUNT_ID`.

### Create an API token for Stream

4. Click your profile icon (top right) > **My Profile > API Tokens > Create Token**.
5. Click **Get Started** next to "Create Custom Token".
6. Name it `jamie-memories-stream`.
7. Under Permissions: `Account > Cloudflare Stream > Edit`.
8. Click **Continue to Summary > Create Token**.
9. Copy the token — this is your `CF_STREAM_TOKEN` (goes in Netlify, NOT the `.env` file).

---

## Step 3 — Netlify (hosting)

1. Go to [netlify.com](https://netlify.com) and create a free account.
2. Click **Add new site > Import an existing project**.

### Deploy from GitHub (recommended)

3. Push this project folder to a GitHub repo (any name, can be private).
4. In Netlify, connect your GitHub account and select the repo.
5. Build settings should auto-detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy site**.

### Or deploy by drag-and-drop

3. In your terminal, run: `npm install && npm run build`
4. Drag the `dist` folder onto the Netlify deploy area.
   - Note: Drag-and-drop doesn't support serverless functions, so video upload won't work this way. Use GitHub instead.

### Set environment variables in Netlify

7. In your Netlify site dashboard, go to **Site Configuration > Environment Variables**.
8. Add these variables:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_CF_ACCOUNT_ID` | Your Cloudflare account ID |
| `VITE_ADMIN_PASSWORD` | A strong password you choose (e.g. `jamie2024memories!`) |
| `CF_STREAM_TOKEN` | Your Cloudflare Stream API token (no VITE_ prefix — stays server-side) |

9. After adding variables, go to **Deploys > Trigger deploy > Deploy site**.

---

## Step 4 — Local development (optional)

If you want to run it locally first:

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env.local

# Start dev server
npm run dev
```

The app will be at http://localhost:5173
The admin page will be at http://localhost:5173/admin

Note: The video upload serverless function won't work locally without the Netlify CLI.
To test video upload locally: `npm install -g netlify-cli && netlify dev`

---

## Step 5 — Share the link

Once deployed, Netlify gives you a URL like `https://whimsical-fox-abc123.netlify.app`.

You can customize this:
- In Netlify: **Site Configuration > General > Site details > Change site name** → e.g. `jamie-memories.netlify.app`
- Or add a custom domain if you have one: **Domain management > Add domain**.

Share the main URL with family and friends.
The admin page is at `/admin` — only you and your cousin need this.

---

## Using the admin page

Go to `your-site-url.netlify.app/admin`.

- Log in with the `VITE_ADMIN_PASSWORD` you set.
- **Pending** tab: new submissions waiting for review.
- Click any submission to see the full memory, photos, and videos.
- **Approve** saves it to the archive. **Delete** removes it permanently.
- Approved submissions can be viewed/filtered in the **Approved** tab.

---

## Notes on the "for kids" flag

Each submission is tagged:
- **For the girls** — age-appropriate, intended for the daughters
- **Everyone** — family and friends
- **Adults only** — not intended for the girls

This is metadata — it doesn't automatically hide or show anything right now.
As the girls grow up, your cousin can filter the approved submissions by this flag
to curate what they share with them at different ages.

A future "gallery" view could be added that filters by this flag automatically.
Ask if you'd like that added.

---

## Rough capacity on free tiers

| | Free limit | Realistic capacity |
|---|---|---|
| Photos | 1GB (Supabase) | ~2,000 compressed photos |
| Videos | 1,000 min (Cloudflare Stream $5/mo) | ~500 avg 2-min clips |
| Text memories | 500MB database | Effectively unlimited |

---

## Questions?

The code is in `src/`. The main submission form is `src/App.jsx`. The admin interface is `src/pages/AdminPage.jsx`. Both are straightforward React — easy to modify if you want to change wording, colors, or add fields.
