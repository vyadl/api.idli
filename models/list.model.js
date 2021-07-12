const mongoose = require('mongoose');

const List = mongoose.model(
  'List',
  new mongoose.Schema({
    userId: String,
    name: String,
    isPrivate: Boolean,
    items: [
      {
        type: 'ObjectId',
        ref: 'Item',
      },
    ],
  }),
);

module.exports = List;
