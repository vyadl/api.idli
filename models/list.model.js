const mongoose = require('mongoose');
const { toClient, listToClientPopulated } = require('./../utils/utils');

const schema = new mongoose.Schema({
  userId: {
    type: String,
    index: true,
  },
  title: String,
  isPrivate: Boolean,
  tags: Array,
  categories: Array,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
  itemsUpdatedAt: Date,
  items: [
    {
      type: 'ObjectId',
      ref: 'Item',
    },
  ],
  referringItems: {
    type: [{
      type: 'ObjectId',
      ref: 'Item',
    }],
    default: null,
  },
});

schema.method('toClient', toClient);
schema.method('listToClientPopulated', listToClientPopulated);

module.exports = mongoose.model('List', schema);
