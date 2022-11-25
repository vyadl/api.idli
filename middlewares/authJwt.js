const jwt = require('jsonwebtoken');
const { accessTokenBlackListStorage } = require('./../storage/auth/accessTokenBlackList.storage');
const db = require('../models');
const User = db.user;
const Role = db.role;
const SECRET_AUTH_KEY = process.env.SECRET_AUTH_KEY;

const checkTokenWhenExist = async ({ req, res, next }) => {
  const token = req.headers['x-access-token'];

  if (accessTokenBlackListStorage.isInList(token)) {
    return res.status(400).send({ message: 'Token is not valid anymore.' });
  }

  try {
    const result = await jwt.verify(token, SECRET_AUTH_KEY);

    req.userId = result.id;

    next();
  } catch {
    return res.status(401).send({ message: 'Invalid JWT Token' });
  }
}

const verifyTokenIfNotPublic = (req, res, next) => {
  const isPublic = !req.isPrivateRequest;

  if (isPublic) {
    return next();
  }

  checkTokenWhenExist({ req, res, next });
};

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided.' });
  }

  checkTokenWhenExist({ req, res, next });
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
  verifyTokenIfNotPublic,
  isAdmin,
};

module.exports = authJwt;
