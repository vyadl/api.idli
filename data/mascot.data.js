const mongoose = require('mongoose');
const Role = require('./../models/role.model');
const lists = require('./mascot.lists.data');
const items = require('./mascot.items.data');
const user = require('./mascot.user.data');

const now = new Date();

exports.user = {
  ...user,
  _id: mongoose.Types.ObjectId(user._id),
};
exports.lists = [
  ...lists.map(list => ({ ...list, _id: mongoose.Types.ObjectId(list._id) })),
];
exports.items = [
  ...items.map(item => ({ ...item, _id: mongoose.Types.ObjectId(item._id) })),
];