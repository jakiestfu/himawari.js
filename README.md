<a href="https://github.com/jakiestfu/himawari.js">
  <img src="http://i.imgur.com/ACD9g0q.png">
</a>


## Getting Started

```sh
brew install imagemagick
brew install graphicsmagick
npm i himawari
```

## Usage
```javascript
var himawari = require('himawari');

himawari({

  /**
   * The zoom level of the image. Can be 1-4 (default: 1)
   * Each zoom level requires more images to be downloaded and therefore stitched
   * together.
   * @type {Number}
   */
  zoom: 1,

  /**
   * The time of the picture desired
   * @type {Date}
   */
  date: new Date(),

  /**
   * The location to save the resulting image
   * @type {String}
   */
  outfile: '/Users/jkelley/Desktop/earth.jpg',

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
    console.log(info.outfile + ': ' + info.part+'/'+info.total);
  }
});

```
