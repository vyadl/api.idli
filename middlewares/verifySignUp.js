const db = require('../models');
const ROLES = db.ROLES;
const User = db.user;
const { resolve500Error } = require('./../middlewares/validation');
const { signUpValidationStorage } = require('./../storage/auth/signUpValidation.storage');

const checkDuplicationUsernameOrEmail = (req, res, next) => {
  User.findOne({
    username: req.body.username,
  }).exec((err, user) => {
    resolve500Error(err, res);

    if (user) {
      return res.status(400).send({ message: 'Failed! Username is already in use/' })
    }

    User.findOne({
      email: req.body.email,
    }).exec((err, email) => {
      resolve500Error(err, res);

      if (email) {
        return res.status(400).send({ message: 'Failed! Email is already in use/' })
      }

      next();
    });
  });
};

const checkIsEveryRoleExisted = (req, res, next) => {
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

const checkValidationCode = (req, res, next) => {
  const { email, validationCode } = req.body;
  const isValid = signUpValidationStorage.isValid(email, validationCode);

  if (!isValid) {
    return res.status(400).send('Validation code is not correct.');
  }

  next();
}

const verifySignUp = {
  checkDuplicationUsernameOrEmail,
  checkIsEveryRoleExisted,
  checkValidationCode,
}

module.exports = verifySignUp;
