const db = require('../models');
const User = db.user;
const Role = db.role;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { resolve500Error } = require('./../middlewares/validation');

exports.signup = (req, res) => {
  const now = new Date();
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  user.save((err, user) => {
    resolve500Error(err, req, res);
    
    if (req.body.roles) {
      const parsedRoles = JSON.parse(req.body.roles);

      Role.find(
        { name: { $in: parsedRoles } },
        (err, roles) => {
          resolve500Error(err, req, res);

          user.roles = roles.map(role => role._id);
          user.save(err => {
            resolve500Error(err, req, res);

            res.send({ message: 'User successfully created' });
          })
        },
      )
    } else {
      Role.findOne(
        { name: 'user' },
        (err, role) => {
        resolve500Error(err, req, res);

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
          }

          res.send({ message: 'User successfully created' });
        })
      });
    }
  })
};

exports.signin = (req, res) => {
  res.status(200).send({ message: 'dsfd fsdf' });
};
