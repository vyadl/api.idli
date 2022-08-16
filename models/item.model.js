const mongoose = require('mongoose');
const { toClient, itemToClientPopulated } = require('./../utils/utils');

const schema = new mongoose.Schema({
  listId: {
    type: String,
    index: true,
  },
  userId: {
    type: String,
    index: true,
  },
  title: String,
  details: String,
  tags: Array,
  category: Number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date,
  relatedLists: {
    type: [String],
    default: null,
  },
  relatedItems: {
    type: [String],
    default: null,
  },
  referringItems: {
    type: [String],
    default: null,
  },
});

schema.method('toClient', toClient);
schema.method('itemToClientPopulated', itemToClientPopulated);

module.exports = mongoose.model('Item', schema);
