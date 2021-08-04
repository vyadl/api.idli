const { rawListeners } = require('../models/role.model');
const db = require('../models');
const ROLES = db.ROLES;
const User = db.user;
const { resolve500Error } = require('./../middlewares/validation');

const checkDuplicationUsernameOrEmail = (req, res, next) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    resolve500Error(err, req, res);

    if (user) {
      res.status(400).send({ message: 'Failed! Username is already in use/' })
    }

    User.findOne({
      email: req.body.email,
    }).exec((err, email) => {
      resolve500Error(err, req, res);

      if (email) {
        res.status(400).send({ message: 'Failed! Email is already in use/' })
      }

      next();
    });
  });
};

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    const roles = JSON.parse(req.body.roles);

    for (let i = 0; i < roles.length; i++) {
      if (!ROLES.includes(roles[i])) {
        return res.status(400).send({
          message: `Failed! Role ${roles[i]} does not exist!`
        });
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicationUsernameOrEmail,
  checkRolesExisted,
}

module.exports = verifySignUp;
