//const db = require('../models');
//const User = db.user;
//const Role = db.role;
//const jwt = require('jsonwebtoken');
//const bcrypt = require('bcryptjs');
//const { resolve500Error } = require('./../middlewares/validation');

exports.signup = (req, res) => {
  res.status(200).send({ message: 'sfsdf' });
  // const now = new Date();
  // const user = new User({
  //   username: req.body.username,
  //   email: req.body.email,
  //   password: bcrypt.hashSync(req.body.password, 8),
  //   createdAt: now,
  //   updatedAt: now,
  //   deletedAt: null,
  // });

  // user.save((err, user) => {
  //   resolve500Error(err, req, res);
    
  //   if (req.body.roles) {
  //     const parsedRoles = JSON.parse(req.body.roles);

  //     Role.find(
  //       { name: { $in: parsedRoles } },
  //       (err, roles) => {
  //         resolve500Error(err, req, res);

  //         user.roles = roles.map(role => role._id);
  //         user.save(err => {
  //           resolve500Error(err, req, res);

  //           res.send({ message: 'User successfully created' });
  //         })
  //       },
  //     )
  //   } else {
  //     Role.findOne(
  //       { name: 'user' },
  //       (err, role) => {
  //       resolve500Error(err, req, res);

  //       user.roles = [role._id];
  //       user.save(err => {
  //         if (err) {
  //           res.status(500).send({ message: err });
  //         }

  //         res.send({ message: 'User successfully created' });
  //       })
  //     });
  //   }
  // })
};

exports.signin = (req, res) => {
  res.status(200).send({ message: 'sfsdf' });
  // User.findOne({ username: req.body.username })
  //   .populate('roles', '-__v')
  //   .exec((err, user) => {
  //     if (err) {
  //       return res.status(500).send({ message: err });
  //     }

  //     if (!user) {
  //       return res.status(404).send({ message: 'User not found' });
  //     }

  //     const isPasswordValid = bcrypt.compareSync(
  //       req.body.password,
  //       user.password,
  //     );
      
  //     if (user.deletedAt) {
  //       return res.status(410).send({
  //         accessToken: null,
  //         message: 'User was deleted',
  //       })
  //     }

  //     if (!isPasswordValid) {
  //       return res.status(404).send({
  //         accessToken: null,
  //         message: 'Invalid password',
  //       })
  //     }

  //     const token = jwt.sign(
  //       { id: user.id },
  //       process.env.SECRET_AUTH_KEY,
  //       { expiresIn: 60 * 60 * 24 }, // 1 day
  //     )
  //     const authorities = [];

  //     for (let i = 0; i < user.roles.length; i++) {
  //       authorities.push(`ROLE_${user.roles[i].name.toUpperCase()}`);
  //     }

  //     res.status(200).send({
  //       id: user._id,
  //       username: user.username,
  //       email: user.email,
  //       roles: authorities,
  //       accessToken: token,
  //     });
  //   }
  // );
};
