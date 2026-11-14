# My Library

A personal book catalog website. Books are stored in a Google Sheet ("My Book Catalog"); this page reads and adds rows through a small Google Apps Script web app.

## Setup

1. Open the **My Book Catalog** sheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with [`apps-script/Code.gs`](apps-script/Code.gs) and change `API_KEY` to a passphrase of your own. Save.
3. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone**. Authorize when asked, then copy the web app URL (ends in `/exec`).
4. Open the site, click **Settings**, paste the URL and your passphrase.

After editing `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the same URL picks up the change.

## Privacy

The site holds no book data. Every read and write requires the passphrase, which stays in your browser's local storage, and is never committed here.
