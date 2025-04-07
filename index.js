require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns'); // <-- Import the dns module
const urlParser = require('url'); // <-- Import the url module (or use URL constructor)
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// --- Add Body Parser Middleware ---
// Handles data submitted in POST requests (like from forms)
// 'extended: false' means it parses simple key-value pairs (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));
// If you were expecting JSON data in the body, you'd use: app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory storage (replace with a database for a real-world persistent app)
let urlDatabase = {}; // Store mapping like { '1': 'https://google.com', '2': 'https://freecodecamp.org' }
let shortUrlCounter = 1; // Simple counter to generate unique IDs

// POST endpoint: Create a new short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url; // Get URL from the POST body (requires body-parser)

  // --- Validate the URL ---
  let hostname;
  try {
    // 1. Check URL format (must start with http:// or https://)
    const parsedUrl = new URL(originalUrl); // Use modern URL constructor
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol'); // Ensure it's http or https
    }
    hostname = parsedUrl.hostname; // Extract hostname for DNS lookup
  } catch (error) {
    // If URL parsing fails (invalid format)
    return res.json({ error: 'invalid url' });
  }

  // 2. Check if the hostname is valid using DNS lookup
  dns.lookup(hostname, (err, address, family) => {
    if (err || !address) {
      // If DNS lookup fails (hostname doesn't resolve)
      return res.json({ error: 'invalid url' });
    } else {
      // --- URL is valid ---
      // Generate short URL ID
      const shortUrl = shortUrlCounter;
      // Store the original URL with its short ID
      urlDatabase[shortUrl] = originalUrl;
      // Increment the counter for the next URL
      shortUrlCounter++;

      // Respond with the required JSON structure
      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    }
  });
});

// GET endpoint: Redirect to the original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrlId = req.params.short_url; // Get the short URL ID from the route parameter
  const originalUrl = urlDatabase[shortUrlId]; // Look up the original URL in our "database"

  if (originalUrl) {
    // If found, redirect the user
    res.redirect(originalUrl);
  } else {
    // If not found, respond with an error (or maybe a 404 page)
    res.json({ error: 'No short URL found for the given input' });
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});