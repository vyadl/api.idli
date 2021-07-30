const mongoose = require('mongoose');

const Item = mongoose.model(
  'Item',
  new mongoose.Schema({
    listId: String,
    text: String,
    details: String,
    tags: Array,
    category: Number,
  }),
);

module.exports = Item;
