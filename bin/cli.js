#!/usr/bin/env node

var himawari = require('../');
var fs = require('fs');
var path = require('path');
var cliclopts = require('cliclopts');
var minimist = require('minimist');

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
    name: 'outfile',
    abbr: 'o',
    help: 'The location to save the resulting image. (default: "himawari-{date}.jpg" in current directory)'
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
  process.exit();
}

var defaultBasename = 'himawari' + '-' + argv.date + '.jpg';
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
  outfile = path.join(dirname, defaultBasename);
}

console.log('Creating ' + basename + ' in ' + dirname + ' ...');

himawari({
  zoom: argv.zoom,
  outfile: outfile,
  date: argv.date,
  success: function () {
    console.log('Complete!');
    process.exit();
  },
  error: function (err) {
    console.log(err);
    process.exit(1);
  },
  chunk: function (info) {
    console.log('Saved', info.part + '/' + info.total);
  }
});
