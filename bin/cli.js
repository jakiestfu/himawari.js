#!/usr/bin/env node

var cliclopts = require('cliclopts');
var fs        = require('fs');
var himawari  = require('../');
var minimist  = require('minimist');
var moment    = require('moment');
var path      = require('path');
var pkg       = require('../package.json');

var allowedOptions = [
  {
    name: 'zoom',
    abbr: 'z',
    help: 'The zoom level of the image. Can be 1-5.',
    default: 1
  },
  {
    name: 'date',
    abbr: 'd',
    help: 'The time of the picture desired. If you want to get the latest image, use "latest".',
    default: 'latest'
  },
  {
    name: 'debug',
    abbr: 'l',
    help: 'Turns on logging',
    boolean: true
  },
  {
    name: 'outfile',
    abbr: 'o',
    help: 'The location to save the resulting image. (default: "himawari-{date}.jpg" in current directory)'
  },
  {
    name: 'parallel',
    abbr: 'p',
    help: 'Parallelize downloads for increased speeds (can be CPU intensive)',
    boolean: true
  },
  {
    name: 'skipempty',
    abbr: 's',
    help: 'Don\'t download images that contain "No Image"',
    boolean: true
  },
  {
    name: 'timeout',
    abbr: 't',
    help: 'The max duration in milliseconds before requests for images and data times out'
  },
  {
    name: 'urls',
    abbr: 'u',
    help: 'Only print the URLs of the images that would have been downloaded',
    boolean: true
  },
  {
    name: 'infrared',
    abbr: 'i',
    help: 'Capture picture on the infrared spectrum',
    boolean: true
  },
  {
    name: 'version',
    abbr: 'v',
    help: 'Prints the version of the package',
    boolean: true
  },
  {
    name: 'help',
    abbr: 'h',
    help: 'Show help',
    boolean: true
  }
];

var opts = cliclopts(allowedOptions);
var argv = minimist(process.argv.slice(2), opts.options());

if (argv.help) {
  console.log('Usage: himawari [options]');
  opts.print();
  return process.exit();
}

if (argv.version) {
  console.log(pkg.version);
  return process.exit();
}

var parsedDate = new Date(argv.date || new Date().toString());
if (parsedDate.toString().toLowerCase().indexOf('invalid') !== -1) { parsedDate = null; }
var date = moment.isDate(parsedDate) ? parsedDate : new Date();
var defaultBasename = 'himawari' + '-' + date.getTime() + '.jpg';
var basename;
var dirname;
var outfile;

if (argv.outfile) {
  outfile = path.normalize(argv.outfile);

  // Ensure we're saving to a file if a folder was provided
  if (fs.existsSync(outfile) && fs.statSync(outfile).isDirectory()) {
    outfile = path.join(outfile, defaultBasename);
  }

  basename = path.basename(outfile);
  dirname = path.dirname(outfile);
} else {
  dirname = process.cwd();
  basename = defaultBasename;
  outfile = path.join(dirname, defaultBasename);
}

himawari({
  zoom: argv.zoom,
  outfile: outfile,
  date: argv.date,
  debug: argv.debug,
  infrared: argv.infrared,
  parallel: argv.parallel,
  skipEmpty: argv.skipempty,
  timeout: argv.timeout,
  urls: argv.urls,
  success: function (info) {
    if (!argv.urls) {
      console.log('Complete', info);
    }
    process.exit();
  },
  error: function (err) {
    console.log(err);
    process.exit(1);
  },
  chunk: function (info) {
    if (!argv.urls) {
      console.log('Saved', info.part + '/' + info.total);
    }
  }
});
