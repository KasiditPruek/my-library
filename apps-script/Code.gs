/**
 * My Library API — paste this into Extensions > Apps Script in the "My Book Catalog" sheet,
 * set API_KEY below, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone).
 */

// 1. Choose your own passphrase. You'll type the same one into the website once.
const API_KEY = 'CHANGE-ME';

// 2. The catalog spreadsheet (already filled in).
const SHEET_ID = '1XJIE29GFgvqJrYerkvthmM-tc8hyS7hGwI2YbU2bwZQ';

const BOOKS_TAB = 'Books';
const SUMMARY_TAB = 'Summary';
const GENRE_RANGE = 'A12:A25';
const STATUSES = ['Read', 'Reading', 'To read'];
const COLUMNS = ['title', 'author', 'genre', 'shelf', 'status', 'rating', 'acquired', 'notes'];

function doGet(e) {
  try {
    checkKey_(e.parameter.key);
    return json_({ ok: true, books: readBooks_(), genres: readGenres_(), statuses: STATUSES });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    checkKey_(body.key);
    const b = body.book || {};

    const title = clean_(b.title);
    const author = clean_(b.author);
    if (!title) throw new Error('Title is required.');
    if (!author) throw new Error('Author is required.');

    const genres = readGenres_();
    const genre = clean_(b.genre);
    if (genre && genres.indexOf(genre) === -1) throw new Error('Unknown genre: ' + genre);

    const status = clean_(b.status);
    if (status && STATUSES.indexOf(status) === -1) throw new Error('Unknown status: ' + status);

    let rating = '';
    if (b.rating !== undefined && b.rating !== null && b.rating !== '') {
      rating = Number(b.rating);
      if (!(rating >= 1 && rating <= 5)) throw new Error('Rating must be 1 to 5.');
    }

    let acquired = '';
    if (b.acquired) {
      const m = String(b.acquired).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) throw new Error('Date must be YYYY-MM-DD.');
      acquired = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }

    lock.waitLock(10000);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(BOOKS_TAB);
    const row = firstEmptyRow_(sheet);
    sheet.getRange(row, 1, 1, 8).setValues([[
      title, author, genre, clean_(b.shelf), status, rating, acquired, clean_(b.notes)
    ]]);
    SpreadsheetApp.flush();

    return json_({ ok: true, row: row });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function readBooks_() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(BOOKS_TAB);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, 8).getDisplayValues()
    .map(function (r, i) {
      const o = { row: i + 2 };
      COLUMNS.forEach(function (c, j) { o[c] = r[j]; });
      return o;
    })
    .filter(function (o) { return o.title; });
}

function readGenres_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SUMMARY_TAB)
    .getRange(GENRE_RANGE).getDisplayValues()
    .map(function (r) { return r[0].trim(); })
    .filter(String);
}

// First row with an empty Title, so the banding and dropdowns already set on the sheet are reused.
function firstEmptyRow_(sheet) {
  const last = Math.max(sheet.getLastRow(), 1);
  const titles = sheet.getRange(1, 1, last, 1).getValues();
  for (let i = titles.length - 1; i >= 0; i--) {
    if (String(titles[i][0]).trim() !== '') return i + 2;
  }
  return 2;
}

function checkKey_(key) {
  if (API_KEY === 'CHANGE-ME') throw new Error('Set API_KEY in the Apps Script first.');
  if (key !== API_KEY) throw new Error('Wrong passphrase.');
}

function clean_(v) {
  return v === undefined || v === null ? '' : String(v).trim().slice(0, 1000);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
