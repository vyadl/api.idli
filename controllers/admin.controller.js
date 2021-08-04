const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const { resolve500Error } = require('./../middlewares/validation');

exports.hardDeleteUser = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(404).send({ message: 'Id is needed' });
  }

  User.deleteOne(
    { _id: id },
    (err, { deletedCount }) => {
      resolve500Error(err, req, res);

      if (!deletedCount) {
        return res.status(400).send({ message: `User with id ${id} does not exist` });
      }

      res.status(200).send({ message: `User with id ${id} is deleted` });
    }
  );
};

exports.softDeleteUser = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(404).send({ message: 'Id is needed' });
  }

  User.findById(id).exec((err, user) => {
    resolve500Error(err, req, res);

    if (!user) {
      return res.status(400).send({ message: `User with id ${id} does not exist` });
    }

    user.isDeleted = true;

    user.save(err => {
      resolve500Error(err, req, res);

      res.send({ message: 'User successfully soft deleted' });
    })
  });
};
