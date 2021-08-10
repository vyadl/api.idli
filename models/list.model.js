const mongoose = require('mongoose');
const { toClient, listToClientPopulated } = require('./../utils/utils');

const schema = new mongoose.Schema({
  userId: String,
  name: String,
  isPrivate: Boolean,
  tags: Array,
  categories: Array,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
  items: [
    {
      type: 'ObjectId',
      ref: 'Item',
    },
  ],
});

schema.method('toClient', toClient);
schema.method('listToClientPopulated', listToClientPopulated);

module.exports = mongoose.model('List', schema);
