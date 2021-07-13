const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const List = require('../models/list.model');
const Item = require('../models/item.model');

exports.addItem = (req, res) => {
  echo(req);
  const body = req.body;

  if (!body.text) {
    res.status(400).send({ message: 'Text is required' });
  }

  if (!req.params.listid) {
    res.status(400).send({ message: 'List ID is required' });
  }

  const item = new Item({
    listId: req.params.listid,
    text: req.body.text,
    details: req.body.details,
    tags: req.body.tags || [],
    categories: req.body.categories || [],
  });

  List.findById(req.params.listid).exec((err, list) => {
    list.items.push(item);

    item.save(err => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      list.save((err, list) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
    
        res.status(200).send({ item });
      });
    });
  });
}

exports.updateItem = (req, res) => {
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

exports.deleteItem = (req, res) => {
  Item.findByIdAndDelete(req.params.id).exec(err => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    res.status(200).send({ message: 'The item is successfully deleted' });
  });
}
