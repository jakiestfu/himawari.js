<a href="http://jakiestfu.github.io/himawari.js/demo/">
  <img src="http://i.imgur.com/MUefuXm.png">
</a>

> Download real-time images of Earth from the Himawari-8 satellite

[![npm][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/himawari.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/himawari

[Himawari 8](http://himawari8.nict.go.jp/) is a [geostationary](https://en.wikipedia.org/wiki/Geostationary_orbit) weather satellite deployed by the [Japan Meteorological Agency](http://www.jma.go.jp/jma/indexe.html). It takes photographs of Earth every 10 minutes.

* [Getting Started](#getting-started)
* [Usage](#usage)
* [Command Line Interface](#command-line-interface)
* [Acknowledgements](#acknowledgements)
* [Example Images](#example-images)
* [Example Scripts](#example-scripts)
* [Licensing](#licensing)

## Getting Started

```sh
brew install imagemagick
brew install graphicsmagick
npm i himawari
```

If you would like to generate videos, `ffmpeg` is also required.
```sh
brew install ffmpeg
```

## Usage
```javascript
var himawari = require('himawari');

himawari({

  /**
   * The zoom level of the image. Can be 1-5 for non-infrared, and 1-3 for infrared (default: 1)
   * Each zoom level requires more images to be downloaded and therefore stitched
   * together. Higher zoom yields a higher resolution image.
   * @type {Number}
   */
  zoom: 1,

  /**
   * The time of the picture desired. If you want to get the latest image, use 'latest'
   * @type {String|Date}
   */
  date: 'latest', // Or new Date() or a date string

  /**
   * Turns on logging
   * @type {Boolean}
   */
  debug: false,

  /**
   * If set to true, an image on the infrared light spectrum will be generated. Please note that
   * infrared only supports zooms up to 3
   * @type {Boolean}
   */
  infrared: false,

  /**
   * The location to save the resulting image
   * @type {String}
   */
  outfile: '/path/to/output/earth.jpg',

  /**
   * Set to true to parallelize tile downloads. Can be CPU intensive but decreases time to download images.
   * @type {Boolean}
   */
  parallel: false,

  /**
   * Skip empty images from being saved
   * @type {Boolean}
   */
  skipEmpty: true,

  /**
   * The max duration in milliseconds before requests for images and data times out
   * @type {Number}
   */
  timeout: 30000,

  /**
   * If true, only prints the URLs of the images that would have been downloaded
   * @type {Boolean}
   */
  urls: false,

  /**
   * A success callback if the image downloads successfully
   * @type {Function}
   */
  success: function () { process.exit(); },

  /**
   * A callback if the image cannot be downloaded or saved
   * @type {Function}
   * @param  {Object} err An error object or information surrounding the issue
   */
  error: function (err) { console.log(err); },

  /**
   * A callback that is fired every time a tile has been downloaded.
   * @param  {Object} info Information about the download such as filepath, part, and total images
   */
  chunk: function (info) {
    console.log(info.outfile + ': ' + info.part + '/' + info.total);
  }
});

```

## Command Line Interface

There is also a command-line interface available if you install it with `-g`.

```sh
npm i -g himawari
```

This installs a program called `himawari` that can be used like so:

```sh
Usage: himawari [options]
    --zoom, -z            The zoom level of the image. Can be 1-5. (Default: `1`)
    --date, -d            The time of the picture desired. If you want to get the latest image, use 'latest'. (Default: `"latest"`)
    --debug, -l           Turns on logging. (Default: `false`)
    --outfile, -o         The location to save the resulting image. (Default: `"himawari-{date}.jpg"` in current directory)
    --parallel, -p        Parallelize downloads for increased speeds (can be CPU intensive)
    --skipempty, -s       Skip saving images that contain no useful information (i.e. "No Image") (Default: `true`)
    --timeout, -t         The max duration in milliseconds before requests for images and data times out (Default: `30000`)
    --urls, -u            Only print the URLs of the images that would have been downloaded (Default: `false`)
    --infrared, -i        Capture picture on the infrared spectrum (Default: `false`)
    --version, -v         Prints the version of the package
    --help, -h            Show help
```

## Acknowledgements
* [Japan Meteorological Agency](http://www.jma.go.jp/)
* [NICT](http://www.nict.go.jp/)
* [Michael Pote](https://github.com/MichaelPote) created a [Powershell Script](https://gist.github.com/MichaelPote/92fa6e65eacf26219022) that inspired this library.

## Example Images
<img src="http://i.imgur.com/kJcfCoN.jpg">
<img src="http://i.imgur.com/376ZTvB.jpg" width="50%"><img src="http://i.imgur.com/XnAAjzy.jpg" width="50%">

## Example Scripts
There are two example files that showcase how Himawari.js can be used. The first, `basic.js`, is to simply be executed and will download the latest image of earth and save it to your Desktop.

The second, `video.js`, will get a particular date (one where it starts off all black), and will decrement 10 minutes from that date until it has been 24 hours. The resulting images will be saved to a directory, and then piped to `ffmpeg` which will stitch the images together in a lovely video for you to oogle over.

## Licensing
MIT
