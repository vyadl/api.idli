const { validationResult } = require('express-validator');
const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const List = require('../models/list.model');

exports.getListsForCurrentUser = (req, res) => {
  List.find({ userId: req.userId })
    .exec((err, lists) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      res.status(200).send({ lists });
    });
}

exports.getListsById = (req, res) => {
  List.find({ userId: req.params.id })
    .exec((err, lists) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      const publicLists = lists.filter(list => !list.isPrivate);

      res.status(200).send({ lists: publicLists });
    });
}

exports.getList = (req, res) => {
  const listId = req.params.id;

  List.findById(listId)
    .populate('items', '-__v')
    .exec((err, list) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!list) {
        return res.status(404).send({ message: 'List doesn\'t exist' });
      }

      if (!list.isPrivate) {
        res.status(200).send({ list });
      } else {
        if (!req.userId) {
          echo(1);
          res.status(400).send({ message: 'List is private' });
        } else if (req.userId !== list.userId) {
          return res.status(400).send({ message: 'List is private 2' });
        } else {
          return res.status(200).send({ list });
        }
      }
  });
}

exports.addList = (req, res) => {
  const list = new List({
    userId: req.userId,
    name: req.body.name,
    isPrivate: req.body.isPrivate || false,
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

exports.updateList = (req, res) => {
  List.findById(req.params.listid, (err, list) => {
    Object.keys(req.body).forEach(field => {
      list[field] = req.body[field];
    });

    echo(list);

    list.save((err, updatedList) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      res.status(200).send({ updatedList });
    });
  });
}

exports.deleteList = (req, res) => {
  List.findByIdAndDelete(req.params.listid).exec(err => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    res.status(200).send({ message: 'The list is successfully deleted' });
  });
}
