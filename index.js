require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Mount body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});
app.post('/api/shorturl', urlShortenerHandler);
app.get('/api/shorturl/:short_url', shortUrlHandler);

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

// An object to store Original url and their short url
const urlStore = {
  count: 0,
  store: new Map(),
  reverseStore: new Map(),

  // Method to add a new URL and its corresponding short URL to the store
  add(key, value) {
    this.store.set(`${key}`, value);
    this.reverseStore.set(value, `${key}`);
    this.count++;
  },

  // Method to retrieve the short URL based on the original URL
  getShortUrl(value) {
    return this.reverseStore.get(value) || null;
  }
};

// URL Shortener Microservice handler
function urlShortenerHandler(req, res) {
  // Get URL from request
  let { url } = req.body;
  url_parsed = url.split("//")[1] || null;

  if (!url_parsed) {
    // Invalid URL format
    res.json({ 'error': 'invalid url' });
  } else {
    // Get hostname from URL
    const hostname = new URL(url).hostname;
    dns.lookup(hostname, (err) => {
      if (err) {
        // Invalid URL or DNS lookup error
        res.json({ 'error': 'invalid url' });
      } else {
        const existingShortUrl = urlStore.getShortUrl(url);

        if (existingShortUrl) {
          // Short URL already exists in the store
          res.json({ 'original_url': url, 'short_url': existingShortUrl });
        } else {
          // Generate a new short URL and add it to the store
          const short_url = urlStore.count + 1;
          urlStore.add(short_url, url);
          console.log(urlStore);
          res.json({ 'original_url': url, 'short_url': short_url });
        }
      }
    });
  }
}

function shortUrlHandler(req, res) {
  let { short_url } = req.params;
  const originalUrl = urlStore.store.get(short_url) || null;

  if (originalUrl) {
    // Redirect to the original URL
    res.redirect(originalUrl);
  } else {
    // Short URL not found
    res.status(404).json({ error: 'Resource not found' });
  }
}