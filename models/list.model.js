const mongoose = require('mongoose');

const List = mongoose.model(
  'List',
  new mongoose.Schema({
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
  }),
);

module.exports = List;
