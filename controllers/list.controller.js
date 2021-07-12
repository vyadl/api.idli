const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const List = require('../models/list.model');

exports.getLists = (req, res) => {
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

  List.findById(listId).exec((err, list) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!list) {
      res.status(404).send({ message: 'List doesn\'t exist' });
    }

    if (!list.isPrivate) {
      res.status(200).send({ list });
    } else {
      if (!req.userId) {
        res.status(401).send({ message: 'List is private' });
        return;
      } else if (req.userId !== list.userId) {
        res.status(401).send({ message: 'List is private 2' });
        return;
      } else {
        res.status(200).send({ list });
      }
    }
  });
}

exports.addList = (req, res) => {
  const body = req.body;

  if (!body.name) {
    res.status(400).send({ message: 'Name is required' });
  }

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
