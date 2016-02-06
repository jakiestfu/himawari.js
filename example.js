var himawari = require('./index');

himawari({
  zoom: 1,
  outfile: process.env.HOME + '/Desktop/earth.jpg',
  date: 'latest',
  success: function () {
    console.log("Complete!");
    process.exit();
  },
  chunk: function (info) {
    console.log('Saved', info.part + '/' + info.total);
  }
});
