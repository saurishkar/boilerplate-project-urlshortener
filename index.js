require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const CryptoJS = require("crypto");
const parser = require("body-parser");
const url = require('url');    

mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: String
})

const URLModel = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(parser.urlencoded())
app.use(parser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'Hello API' });
});

app.post('/api/shorturl', function(req, res) {
  const urlParam = req.body.url;

  try {
    const myURL = new URL(urlParam);
    if(myURL.protocol != "http:" && myURL.protocol != "https:") {
      throw new Error("invalid");
    }
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  
  const hash = CryptoJS.createHash("shake256", { outputLength: 8 }).update(urlParam).digest("hex");
  const obj = { original_url: urlParam, short_url: hash };
  const urlDoc = new URLModel(obj);
  urlDoc.save(function (err, data) {
    if(err) {
      return res.send(err);
    }
    res.json({ original_url: data.original_url, short_url: data.short_url });
  })
});

app.get("/api/shorturl/:shortUrl", function(req, res) {
  const urlParam = req.params.shortUrl;
  URLModel.findOne({ short_url: urlParam }).exec(function (err, data) {
    if(err) return res.send(err);
    res.redirect(data.original_url);
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
