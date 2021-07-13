const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');

exports.hardDeleteUser = (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(404).send({ message: 'Id is needed' });
    return;
  }

  User.deleteOne(
    { _id: id },
    (err, { deletedCount }) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!deletedCount) {
        res.status(400).send({ message: `User with id ${id} does not exist` });
        return;
      }

      res.status(200).send({ message: `User with id ${id} is deleted` });
    }
  );
};

exports.softDeleteUser = (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(404).send({ message: 'Id is needed' });
    return;
  }

  User.findByIs(id).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      res.status(400).send({ message: `User with id ${id} does not exist` });
      return;
    }

    user.isDeleted = true;

    user.save(err => {
      if (err) {
        res.status(500).send({ message: err });
      }

      res.send({ message: 'User successfully soft deleted' });
    })
  });
};