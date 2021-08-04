const mongoose = require('mongoose');
const { toClient } = require('./../utils/utils');

const schema = new mongoose.Schema({
  listId: String,
  text: String,
  details: String,
  tags: Array,
  category: Number,
})

schema.method('toClient', toClient);

module.exports = mongoose.model('Item', schema);
