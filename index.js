var async   = require('async');
var fs      = require('fs');
var gm      = require('gm');
var moment  = require('moment');
var path    = require('path');
var request = require('request');
var rimraf  = require('rimraf');

var base_url = 'http://himawari8-dl.nict.go.jp/himawari8/img/D531106';
var noop = function () {};

module.exports = function (options) {

  // Define some callback defaults
  options.error = typeof options.error == "function" ? options.error : noop;
  options.success = typeof options.success == "function" ? options.success : noop;
  options.chunk = typeof options.chunk == "function" ? options.chunk : noop;

  resolveDate(options.date, function (now) {

    // Normalize our date
    now.setMinutes(now.getMinutes() - (now.getMinutes() % 10));
    now.setSeconds(0);

    // Define some image parameters
    var width = 550;
    var level = {
      1: "4d",
      2: "8d",
      3: "16d",
      4: "20d"
    }[options.zoom] || "4d";
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
    var tmp = './tmp';
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

    // Execute requests
    var count = 1;
    async.eachLimit(tiles, 5, function (tile, cb) {

      // Download images
      var dest = path.join(tmp, tile.name);
      var stream = fs.createWriteStream(dest);
      stream.on('error', function (err) { return cb(err); });
      stream.on('close', function() {

        // Callback with info
        options.chunk({
          chunk: dest,
          part: count,
          total: tiles.length
        });
        count++;
        return cb();
      });

      // Pipe image
      request(url_base + '_' + tile.name).pipe(stream);
    }, function (err) {

      if (err) { return options.error(err); }

      // New Graphics Magick handle
      var magick = gm();

      // Define pages and their respective files
      for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        var coords = '+' + (tile.x*width) + '+' + (tile.y*width);
        magick.in('-page', coords).in(path.join(tmp, tile.name));
      }

      // Stitch together and write to output directory
      magick.mosaic().write(outfile, function (err) {

        if (err) { return options.error(err); }

        // Clean
        rimraf(tmp, function (err) {
          if (err) { return options.error(err); }
          options.success();
        });
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
function resolveDate (input, callback) {

  var date = input;

  // If provided a date string
  if (typeof input == "string" && input !== "latest") {
    date = new Date(input);
  }

  // If provided a date object
  if (moment.isDate(date)) { return callback(date); }

  // If provided "latest"
  else if (input === "latest") {
    request(base_url + '/latest.json', function (err, res) {
      try { date = new Date(JSON.parse(res.body).date); }
      catch (e) { date = new Date(); }
      return callback(date);
    });
  }

  // Invalid string provided, return new Date
  else { return callback(new Date()); }
}