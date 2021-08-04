const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  listId: String,
  text: String,
  details: String,
  tags: Array,
  category: Number,
})

schema.method('toClient', function() {
  const obj = this.toObject();

  obj.id = obj._id;

  delete obj._id;
  delete obj.__v;

  return obj;
});

const Item = mongoose.model('Item', schema);

module.exports = Item;
