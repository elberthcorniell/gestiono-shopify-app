var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
dotenv.config({
  path: '../../.env.development'
});

router.get('/', function(req, res, next) {
  res.redirect(`https://dashboard.${process.env.GESTIONO_DOMAIN}/app/1?appJs=http://localhost:3000/appJs`);
});

router.get('/appJs', function(req, res, next) {
  fs = require('fs');
  path = require('path');
  fs.createReadStream(path.join(__dirname, '../../dist/app-bundle.js')).pipe(res);
});

module.exports = router;
