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
  add(key, value) {
    this.store.set(`${key}`, value);
    this.reverseStore.set(value, `${key}`);
    this.count++;
  },
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
    res.json({ 'error': 'invalid url' });
  } else {
    url_parsed = url_parsed.split("/")[0];
    // Check if URL is valid
    dns.lookup(url_parsed, (err) => {
      if (err) {
        res.json({ 'error': 'invalid url' });
      } else {
        const existingShortUrl = urlStore.getShortUrl(url);
        if (existingShortUrl) {
          res.json({ 'original_url': url, 'short_url': existingShortUrl });
        } else {
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
    res.redirect(originalUrl);
  } else {
    res.status(404).json({ error: 'Resource not found' });
  }
}