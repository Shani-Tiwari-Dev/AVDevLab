# Performance fixes applied

## Images (biggest win)
- `static/owner.jpg`: 2.0MB → 47KB (resized to 800px wide, compressed)
- `static/uploads/products/...jpg`: 2.0MB → 57KB (resized to 900px wide)
- Both images copied into a new `public/static/...` folder — **see "Static
  files now served from CDN" below**, this matters more than the compression.
- New product photo uploads are now auto-resized/compressed by the server
  (`_resize_image_for_upload` in app.py), so an admin uploading a photo
  straight from their phone (often 3-5MB) won't slow the shop page down again.
- Added `loading="lazy"` to product photos and the About-section photo so the
  browser doesn't download images that aren't visible yet.

## Static files now served from CDN, not your Python function
Vercel's own docs say Flask's `static/` folder should not be used for static
assets when deploying — instead files need to live in a `public/` folder at
the project root, which Vercel serves directly from its CDN without ever
invoking your Python function.

Previously, **every single image/CSS request was invoking your serverless
function** — the slowest possible way to serve a picture, and something that
gets worse (queuing, cold starts) the more concurrent visitors you have.

I added a `public/static/` folder mirroring your existing `static/` folder
(logo, favicon, owner.jpg, theme.css). Vercel will now serve these instantly
from its edge network. The `static/` folder is left untouched so local
development (`python app.py`) still works exactly as before.

**Important:** if you replace `owner.jpg`, `theme.css`, `logo.png`, etc. in
the future, remember to copy the updated file into `public/static/` too, or
Vercel will keep serving the old cached CDN version. (Product photos added
through the admin panel don't need this — those already go to Supabase
Storage, which is already a CDN.)

Also added a `headers` rule in `vercel.json` so these files are cached by
visitors' browsers for a year (safe, since uploaded product photos get random
filenames — a changed file is a new URL).

## Database query fixes
- `/cart` and `/cart/submit` used to fetch each product with a separate
  Supabase query in a loop (N+1 queries). Now fetched in one batched query
  with `.in_("id", [...])`. This scales much better when many people check
  out at once.
- Admin dashboard counts (`get_admin_counts`) ran 5 queries one after another
  on every admin page load. Now they run concurrently, cutting that wait to
  roughly 1 query's worth of time instead of 5.
- Added a short (15-30 second) in-memory cache for the homepage
  announcements and shop product list — the two most-visited, most-read
  queries — so 50 people browsing at once hit Supabase far less. The cache
  is automatically cleared the moment an admin adds/removes a product or
  announcement, so changes still show up immediately.

## Response compression
- Added `Flask-Compress` (see `requirements.txt`) so HTML/CSS/JS responses
  are gzip-compressed before being sent — smaller payloads, faster loads,
  especially on mobile data.

## Handling 50 concurrent users
Since this runs on Vercel Functions, it auto-scales per request rather than
using a fixed worker pool — so raw concurrency is less of a bottleneck than
it would be on a single traditional server. The changes above target the
things that *were* actually slow: giant images, redundant DB round-trips per
request, and every static asset going through a serverless function instead
of the CDN. Together these should make page loads noticeably (multiple
seconds) faster, especially on the homepage and shop page.
