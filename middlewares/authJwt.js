const jwt = require('jsonwebtoken');
const config = require('../config/auth.config.js');
const db = require('../models');
const User = db.user;
const Role = db.role;
const { resolve500Error } = require('./../middlewares/validation');

const isAvailable = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    resolve500Error(err, req, res);

    if (user.isDeleted) {
      return res.status(410).send({ message: 'The user is not available' });
    }

    next();
  });
}

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided.' });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid JWT Token' });
    }

    req.userId = decoded.id;

    next();
  });
};

const getUserId = (req, res, next) => {
  const token = req.headers['x-access-token'];

  jwt.verify(token, config.secret, (err, decoded) => {
    if (decoded) {
      req.userId = decoded.id;
    } else {
      req.userId = null;
    }

    next();
  });
};

const isAdmin = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      return res.status(500).send({ message: err });
    }

    Role.find(
      {
        _id: { $in: user.roles }
      },
      (err, roles) => {
        if (err) {
          return res.status(500).send({ message: err });
        }

        const isAdmin = roles.some(role => {
          return role.name === 'admin';
        })

        if (isAdmin) {
          next();

          return;
        }

        res.status(403).send({ message: 'Require Admin role' });
      },
    );
  })
};

const authJwt = {
  verifyToken,
  isAdmin,
  getUserId,
};

module.exports = authJwt;
