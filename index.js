var async   = require('async');
var crypto  = require('crypto');
var extend  = require('deep-extend');
var fs      = require('fs');
var gm      = require('gm');
var moment  = require('moment');
var path    = require('path');
var request = require('request');
var mktemp = require('tmp');

// The number of times a tile will attempted to be downloaded if the download fails
var retries = 5;

// Known hashes of images that contain "No Image" information
var emptyImages = {
  // '412cfd32c1fdf207f9640a1496351f01': 1,
  'b697574875d3b8eb5dd80e9b2bc9c749': 1
};

var himawari = function (userOptions) {

  var options = extend({
    date: 'latest',
    debug: false,
    infrared: false,
    outfile: null,
    parallel: false,
    skipEmpty: true,
    timeout: 30000, // 30 seconds
    urls: false,
    zoom: 1,

    success: function () {},
    error: function () {},
    chunk: function () {},
  }, userOptions);

  function log () {
    if (options.debug) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[Himawari]');
      console.log.apply(console, args);
    }
  }

  // The base URL for the Himawari-8 Satellite uploads
  var image_type = options.infrared ? 'INFRARED_FULL' : 'D531106';
  var base_url = 'https://himawari8-dl.nict.go.jp/himawari8/img/' + image_type;

  log('Resolving date...');
  resolveDate(base_url, options.date, function (err, now) {
    if (err) {
      if (err.code === 'ETIMEDOUT') {
        return console.error('Request to Himawari 8 server timed out. Please try again later.');
      } else {
        return console.error(err);
      }
    }

    log('Date resolved', now.toString());

    // Normalize our date
    now.setMinutes(now.getMinutes() - (now.getMinutes() % 10));
    now.setSeconds(0);

    // Define some image parameters
    var width = 550;
    var level = {
      INFRARED_FULL: {
        1: "1d",
        2: "4d",
        3: "8d"
      },
      D531106: {
        1: "1d",
        2: "4d",
        3: "8d",
        4: "16d",
        5: "20d"
      }
    }[image_type][options.zoom] || "1d";

    log('Zoom level set to ' + level);

    var blocks = parseInt(level.replace(/[a-zA-Z]/g, ''), 10);

    // Format our url paths
    var time  = moment(now).format('HHmmss');
    var year  = moment(now).format('YYYY');
    var month = moment(now).format('MM');
    var day   = moment(now).format('DD');

    var outfile  = options.outfile || './' + [year, month, day, '_', time, '.jpg'].join('');
    var url_base = [base_url, level, width, year, month, day, time].join('/');

    // Compose our requests
    var tiles = [];
    for (var x = 0; x < blocks; x++) {
      for (var y = 0; y < blocks; y++) {
        tiles.push({
          name: x + '_' + y + '.png',
          x: x,
          y: y
        });
      }
    }

    // Create a temp directory
    var tmp = mktemp.dirSync({unsafeCleanup: true});

    // Execute requests
    var count = 1;
    var skipImage = false;
    var flow = options.parallel ? 'each' : 'eachSeries';
    async[flow](tiles, function (tile, cb) {

      if (skipImage) { return cb(); }

      // Attempt to retry downloading image if fails
      async.retry({times: retries, interval: 500}, function (inner_cb) {

        // Download images
        var uri = url_base + '_' + tile.name;
        var dest = path.join(tmp.name, tile.name);
        var stream = fs.createWriteStream(dest);
        stream.on('error', function (err) { return inner_cb(err); });
        stream.on('finish', function () { return log('Tile downloaded', uri); });
        stream.on('close', function() {

          if (options.skipEmpty) {
            var data = fs.readFileSync(dest);
            var hash = crypto.createHash('md5').update(data).digest('hex');

            if (emptyImages[hash]) {
              log('Skipping empty tile...');
              skipImage = true;
              return inner_cb();
            }
          }

          log('Tile saved', dest);

          // Callback with info
          options.chunk({
            chunk: dest,
            part: count,
            total: tiles.length
          });
          count++;
          return inner_cb();
        });

        // Pipe image
        log('Requesting image...', uri);

        if (options.urls) {
          console.log(uri);
          return inner_cb();
        }

        request({
          method: 'GET',
          uri: uri,
          timeout: options.timeout // 30 Seconds
        })
        .on('response', function (res) {
          if (res.statusCode !== 200) {
            // Skip other tiles, jump immediately to the outer callback
            log('Invalid status code');
            return cb('Invalid status code', res);
          }
        })
        .on('error', function (err) {
          // This will trigger our async.retry
          log('Failed to request file');
          return inner_cb('Failed to request file', err);
        })

        // Pipe data to file stream
        .pipe(stream);

      }, cb);

    }, function (err) {

      if (err) {
        log('Error occurred...', err);
        return options.error(err);
      }

      if (options.urls) {
        return options.success();
      }

      // If we are skipping this image
      if (skipImage) {
        // Clean
        log('No image data, skipping...');
        log('Cleaning temp files...');

        tmp.removeCallback();
        return options.success('No image available');
      }

      // New Graphics Magick handle
      var magick = gm();

      // Define pages and their respective files
      for (var i = 0; i < tiles.length; i++) {
        var page = tiles[i];
        var coords = '+' + (page.x*width) + '+' + (page.y*width);
        magick.in('-page', coords).in(path.join(tmp.name, page.name));
      }

      // Stitch together and write to output directory
      log('Stitching images together...');
      magick.mosaic().write(outfile, function (err) {

        if (err) { return options.error(err); }

        // Clean
        log('Cleaning temp files...');
        tmp.removeCallback();
        return options.success('File saved to ' + outfile);
      });
    });

  });
};

/**
 * Takes an input, either a date object, a date timestamp, or the string "latest"
 * and resolves to a native Date object.
 * @param  {String|Date}   input    The incoming date or the string "latest"
 * @param  {Function} callback The function to be called when date is resolved
 */
function resolveDate (base_url, input, callback) {

  var date = input;

  // If provided a date string
  if ((typeof input == "string" || typeof input == "number") && input !== "latest") {
    date = new Date(input);
  }

  // If provided a date object
  if (moment.isDate(date)) { return callback(null, date); }

  // If provided "latest"
  else if (input === "latest") {
    var latest = base_url + '/latest.json';
    request({
      method: 'GET',
      uri: latest,
      timeout: 30000
    }, function (err, res) {
      if (err) return callback(err);
      try { date = new Date(JSON.parse(res.body).date); }
      catch (e) { date = new Date(); }
      return callback(null, date);
    });
  }

  // Invalid string provided, return new Date
  else { return callback(null, new Date()); }
}

himawari.resolveDate = resolveDate;
module.exports = himawari;
