const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const List = require('./../models/list.model');
const Item = require('./../models/item.model');
const { resolve500ErrorInContoller } = require('./../middlewares/validation');


exports.addItem = (req, res) => {
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
      resolve500ErrorInContoller(err, req, res);

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
  Item.findById(req.params.id, (err, list) => {
    Object.keys(req.body).forEach(field => {
      list[field] = req.body[field];
    });

    list.save((err, updatedList) => {
      resolveErrorInContoller(err, req, res);

      res.status(200).send({ updatedList });
    });
  });
}

exports.deleteItem = (req, res) => {
  Item.findByIdAndDelete(req.params.id).exec(err => {
    resolve500ErrorInContoller(err, req, res);

    List.findById(req.params.listid).exec((err, list) => {
      list.items = list.items.filter(id => id !== req.params.id);
  
      list.save((err, list) => {
        resolve500ErrorInContoller(err, req, res);
    
        res.status(200).send({ message: 'The item is successfully deleted' });
      });
    });
  });
}
