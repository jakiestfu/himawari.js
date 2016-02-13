var async     = require('async');
var crypto    = require('crypto');
var exec      = require('child_process').exec;
var fs        = require('fs');
var himawari  = require('../index');
var path      = require('path');

// Image Output Directory
var out = path.join('.', 'video-out');
var video = path.join('.', 'earth.mp4');

// Time resolution (in minutes)
var resolution = 10;

// The start date
var start = "Mon Feb 08 2016 14:49:12 GMT-0800 (PST)";

// 24 Hours in a day, 60 minutes per hour, divided by time resolution
var intervals = (24 * 60) / resolution;

// Counts and a list
var minutes = 0;
var dates = [];

// Create a list of dates starting from `start` and decrement each `interval` by the `resolution`
for (var i = 0; i < intervals; i++) {
  var date = new Date(start);
  date.setMinutes(minutes);
  dates.push(date);
  minutes -= resolution;
}

// More counts n shit
var interval = 1;
var images = [];

// Create our out folder
if (!fs.existsSync(out)) fs.mkdirSync(out);

// Request an image from each date
async.eachSeries(dates, function (date, cb) {
  console.log('Time Interval', interval+'/'+dates.length);
  interval++;

  var outfile = path.join(out, 'earth-' + date.getTime() + '.jpg');

  if (fs.existsSync(outfile)) {
    console.log(outfile + ' exists, skipping');
    return cb();
  }

  // Download that shiz
  himawari({
    outfile: outfile,
    zoom: 1,
    date: date,
    chunk: function (info) {
      console.log('  Part ' + info.part + '/' + info.total);
    },
    success: function () { return cb(); },
    error: function (err) { return cb(err); }
  });
}, function (err, res) {

  // Pipe all images to ffmpeg and create a video. Simple as that!
  exec('cat ' + path.join(out, '*.jpg') + ' | ffmpeg -f image2pipe -vcodec mjpeg -analyzeduration 100M -probesize 100M -i - -vcodec libx264 ' + video, function (err, res) {
    if (err) {
      console.error(err);
    } else {
      console.log('File saved to', video);
    }
  });

});
