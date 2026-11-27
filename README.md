# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
# Google Sheets Catalog

The catalog can be managed from a phone through Google Sheets. Create a sheet with this first row:

`id,description,imageUrl,imageHint,reelUrl,price`

For each product, use an ID such as `catalog-1`, paste the Instagram Reel URL in `reelUrl`, and paste the Google Drive sharing link in `imageUrl`. For Drive images, set the file to **Anyone with the link -> Viewer**. The site converts the sharing link automatically.

Make the Google Sheet publicly readable, then copy its ID from the URL:

`https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

Put that ID in `.env` as `NEXT_PUBLIC_GOOGLE_SHEET_ID`. If the data is on another tab, put that tab's `gid` in `NEXT_PUBLIC_GOOGLE_SHEET_GID`. Restart the development server after changing `.env`. After the site is deployed once, changes to the Sheet appear on the next page refresh without code changes.

# Instagram Reels → YouTube Shorts

New Instagram reels are uploaded to the ISRA YouTube channel as Shorts. Everything used is free.

**1. Google Cloud (one time)**
1. Go to https://console.cloud.google.com, create a project (e.g. "ISRA Shorts"). No billing is needed.
2. APIs & Services → Library → enable **YouTube Data API v3**.
3. APIs & Services → OAuth consent screen: User type **External**, fill in the app name and email, add the scopes `youtube.upload` and `youtube.readonly`, then click **Publish app** (status must be **In production**, otherwise Google expires the connection every 7 days).
4. APIs & Services → Credentials → Create credentials → **OAuth client ID** → Web application. Under *Authorized redirect URIs* add `https://YOUR-SITE/api/youtube/callback` (the exact URI is shown in /admin).

**2. Environment variables** (hosting dashboard, then redeploy)
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` from step 4
- `CRON_SECRET` any long random string
- `SITE_URL` your public address, e.g. `https://israethnic.com` (keeps the redirect URI stable)

**3. Connect**: open /admin → **Connect YouTube** → sign in and pick the ISRA channel. Only reels posted after this moment are uploaded.

**4. Schedule (free)**: `vercel.json` checks for new reels once a day at about 10:30 PM IST (17:00 UTC; Vercel's free plan may run it any time within that hour). A reel posted late at night goes up the next night. Use **Sync now** in /admin to post one right away.

**Public videos**: until Google audits the API project, YouTube keeps uploads **private**. Apply (free) at https://support.google.com/youtube/contact/yt_api_form. Until approved, make Shorts public by hand in YouTube Studio.

Notes: about 6 uploads a day fit in the free YouTube API allowance. Reels that use copyrighted Instagram music can't be downloaded through the API and are skipped.
