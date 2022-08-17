const { logger } = require('./logger');
const { validationResult } = require('express-validator');

console.log(logger);

exports.verifyBasicValidation = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    const firstError = validationResult(req).errors[0];

    return res.status(400).send({
      message: `${firstError.param !== '_error'
        ? firstError.param + ' - '
        : ''}${firstError.msg}`
      });
  }

  next();
};

exports.resolve500Error = (err, res) => {
  if (err) {
    logger.log({
      level: 'error',
      message: err.stack,
    });

    return res.status(500).send({ message: String(err) });
  }
};

exports.handleUserValidation = (user, res) => {
  if (!user) {
    return res.status(410).send({ message: 'User was not found' });
  }

  if (user.deletedAt) {
    return res.status(410).send({ message: 'User was deleted' });
  }
}
