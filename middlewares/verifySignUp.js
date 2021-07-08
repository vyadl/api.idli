const { rawListeners } = require('../models/role.model');
const db = require('../models');
const ROLES = db.ROLES;
const User = db.user;

const checkDuplicationUsernameOrEmail = (req, res, next) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: 'Failed! Username is already in use/' })
    }

    User.findOne({
      email: req.body.email,
    }).exec((err, email) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (email) {
        res.status(400).send({ message: 'Failed! Email is already in use/' })
      }

      next();
    });
  });
};

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`
        });
        return;
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
