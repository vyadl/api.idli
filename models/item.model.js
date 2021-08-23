const mongoose = require('mongoose');
const { toClient } = require('./../utils/utils');

const schema = new mongoose.Schema({
  listId: String,
  title: String,
  details: String,
  tags: Array,
  category: Number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
})

schema.method('toClient', toClient);

module.exports = mongoose.model('Item', schema);
