const mongoose = require('mongoose');
const { toClient } = require('./../utils/utils');

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
    type: [{
      type: 'ObjectId',
      ref: 'List',
    }],
    default: null,
  },
  relatedItems: {
    type: [{
      type: 'ObjectId',
      ref: 'Item',
    }],
    default: null,
  },
  referringItems: {
    type: [{
      type: 'ObjectId',
      ref: 'Item',
    }],
    default: null,
  },
});

schema.method('toClient', toClient);

schema.pre('save', function(next) {
  convertItemsIdsToMongooseIds.call(this);

  next();
});

schema.pre('updateOne', function(next) {
  convertItemsIdsToMongooseIds.call(this);

  next();
});

function convertItemsIdsToMongooseIds() {
  ['relatedItems', 'relatedLists', 'referringItems'].forEach(field => {
    convertIdsToMongooseIdsOrNull.call(this, field);
  });
}

function convertIdsToMongooseIdsOrNull(field) {
  if (this[field]?.length) {
    this[field] =
      this[field].map(itemId => mongoose.Types.ObjectId(itemId));
  } else {
    this[field] = null;
  }
}

module.exports = mongoose.model('Item', schema);
