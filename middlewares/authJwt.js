const jwt = require('jsonwebtoken');
const { accessTokenBlackListStorage } = require('./../storage/auth/accessTokenBlackList.storage');
const db = require('../models');
const User = db.user;
const Role = db.role;
const SECRET_AUTH_KEY = process.env.SECRET_AUTH_KEY;

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided.' });
  }

  if (accessTokenBlackListStorage.isInList(token)) {
    return res.status(400).send({ message: 'Token is not valid anymore.' });
  }

  jwt.verify(token, SECRET_AUTH_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Invalid JWT Token' });
    }

    req.userId = decoded.id;

    next();
  });
};

const getUserId = async (req) => {
  const token = req.headers['x-access-token'];
  
  if (token) {
    try {
    const decoded = await jwt.verify(token, SECRET_AUTH_KEY);

    console.log(decoded);

    return decoded?.id;
    } catch (err) {
      return null;
    }
  } else {
    return null;
  }
};

const isAdmin = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      return res.status(500).send({ message: err });
    }

    Role.find(
      { _id: { $in: user.roles } },
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
