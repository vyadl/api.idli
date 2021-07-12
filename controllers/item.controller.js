const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const List = require('../models/list.model');
const Item = require('../models/item.model');

exports.addItem = (req, res) => {
  const body = req.body;

  if (!body.text) {
    res.status(400).send({ message: 'Text is required' });
  }

  if (!body.listId) {
    res.status(400).send({ message: 'List ID is required' });
  }

  const item = new Item({
    listId: req.body.listId,
    text: req.body.text,
    details: req.body.details,
    tags: req.body.tags || [],
    categories: req.body.categories || [],
  });

  item.save((err, list) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    res.status(200).send({ item });
  });
}

exports.updateList = (req, res) => {
  const list = new List({
    userId: req.userId,
    name: req.body.name,
    isPrivate: req.body.isPrivate,
    items: [],
  });

  list.save((err, list) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    res.status(200).send({ list });
  });
}

exports.deleteList = (req, res) => {
  const list = new List({
    userId: req.userId,
    name: req.body.name,
    isPrivate: req.body.isPrivate,
    items: [],
  });

  list.save((err, list) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    res.status(200).send({ list });
  });
}
