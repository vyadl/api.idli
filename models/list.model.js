const mongoose = require('mongoose');

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

schema.method('toClient', function() {
  const obj = this.toObject();

  obj.id = obj._id;

  delete obj._id;
  delete obj.__v;

  return obj;
});

const List = mongoose.model('List', schema);

module.exports = List;
