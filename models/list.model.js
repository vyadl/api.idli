const mongoose = require('mongoose');
const { toClient } = require('./../utils/utils');

const schema = new mongoose.Schema({
  userId: String,
  name: String,
  isPrivate: Boolean,
  tags: Array,
  categories: Array,
  items: [
    {
      type: 'ObjectId',
      ref: 'Item',
    },
  ],
});

schema.method('toClient', toClient);

module.exports = mongoose.model('List', schema);
