var assert    = require('assert');
var himawari  = require('../index');
var nockBack = require('nock').back;

nockBack.fixtures = __dirname + '/fixtures';

describe('Date Resolver', function () {

  it('should resolve a date objcet', function () {
    var date = new Date();
    himawari.resolveDate("base_url", date, function (err, now) {
      assert.equal(now.getTime(), date.getTime());
    });
  });

  it('should resolve a string date', function () {
    himawari.resolveDate("base_url", "Jan 1 2016 00:00:00 GMT-0800 (PST)", function (err, now) {
      assert.equal(now.getTime(), 1451635200000);
    });
  });

  it('should resolve a numeric date', function () {
    himawari.resolveDate("base_url", 1451635200000, function (err, now) {
      assert.equal(now.toString(), "Fri Jan 01 2016 00:00:00 GMT-0800 (PST)");
    });
  });

  nockBack('latest.json', function (nockDone) {
    it('should resolve a date from the string "latest"', function (cb) {
      himawari.resolveDate("http://himawari8-dl.nict.go.jp/himawari8/img/D531106", "latest", function (err, now) {
        assert.equal(now.getTime(), 1451635200000);
        cb();
        nockDone();
      });
    });
  });

});
