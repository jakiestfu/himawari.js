var himawari = require('../index');

himawari({
  zoom: 1,
  outfile: process.env.HOME + '/Desktop/earth.jpg',
  date: 'latest',
  success: function () {
    console.log("Complete!");
    process.exit();
  },
  chunk: function (info) {
    console.log('COMPLETE', (info.part+'/'+info.total), '(' + ((info.part / info.total)*100).toFixed(0)+'%' + ')');
  }
});
