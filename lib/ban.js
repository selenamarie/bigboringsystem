'use strict';

var level = require('level');

var db = level('./db/bans', {
  createIfMissing: true,
  valueEncoding: 'json'
});

exports.db = function () {
  return db;
};

exports.hammer = function (phone, next) {
  db.put(phone, phone, function (err) {
    if (err) {
      return next(err);
    }

    next(null, phone);
  });
};

exports.unhammer = function (phone, next) {
  db.del(phone, function (err) {
    if (err) {
      return next(err);
    }

    next(null, true);
  });
};

exports.status = function (phone, next) {
  db.get(phone, function (err) {
    if (err) {
      return next(err);
    }

    next(null, true);
  });
};
