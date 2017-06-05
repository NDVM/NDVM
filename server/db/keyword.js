////////////////////////////////////////////////////////////////////////////////
// Keyword Entity
////////////////////////////////////////////////////////////////////////////////
/*global require, exports */
var entity = require('../db/entity').entity;

var keyword = Object.create(entity, {kind: {value: 'keywords'}});

exports.keyword = keyword;

