# Daily Special Website

Static single-page website for the Daily Special barbershop quartet, hosted on GitHub Pages.

## Tech Stack
- Pure HTML/CSS/JavaScript (no build tools)
- Google Sheets for dynamic content (optional)
- Formspree for contact form submissions (optional, falls back to mailto)

## File Structure
```
index.html              - Main (and only) page
assets/css/style.css    - All custom styles
assets/js/app.js        - Navigation, form handling, Google Sheets integration
images/                 - All images (banner, logos, member photos, album art)
favicon/                - Favicon files
```

## Local Development
```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Deploying
Push to the `main` branch. GitHub Pages serves from the root of the repo.

## Content Management

### Option 1: Google Sheets (recommended for non-technical users)

1. **Create a Google Sheet** with three tabs named exactly:
   - `About` — columns: `content` (each row is a paragraph)
   - `Videos` — columns: `title`, `youtube_url`, `description`
   - `Members` — columns: `name`, `part`, `bio`, `photo` (photo can be a URL or blank)

2. **Publish the sheet**: File > Share > Publish to web > Entire Document > Publish

3. **Get the Sheet ID**: From the sheet URL `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`, copy the ID

4. **Configure the site**: Edit `assets/js/app.js` and set:
   ```js
   const CONFIG = {
       SHEET_ID: 'YOUR_SHEET_ID_HERE',
       ...
   };
   ```

5. Commit and push. The site will fetch content from the sheet on each page load.

### Option 2: Edit HTML directly
All default content is in `index.html`. Just edit the text directly.

## Images to Replace
- `images/placeholder-member.svg` — Replace with actual headshot JPGs for each member
  (update the `src` attribute in `index.html` member cards)
- `images/placeholder-album.svg` — Replace with actual album artwork
- `images/banner.jpg` — Hero background image (current one works great)
- `images/ds-logo.png` — Logo (current one is good)

## Contact Form Setup (Formspree)
1. Go to https://formspree.io and create a free account
2. Create a new form, get the form endpoint (e.g., `https://formspree.io/f/xABCDEFG`)
3. Replace `YOUR_FORM_ID` in the form action in `index.html`
4. Without Formspree configured, the form gracefully falls back to opening the user's email client

## Key Colors
- Primary purple: `#6b21a8`
- Light purple: `#a855f7`
- Dark background: `#0d0015`
- Section dark: `#1a0a2e`
