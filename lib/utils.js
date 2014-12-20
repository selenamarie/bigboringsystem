'use strict';

exports.merge = function (objA, objB) {
  for (var key in objB) {
    objA[key] = objB[key];
  }

  return objA;
};