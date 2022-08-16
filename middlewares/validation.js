const { validationResult } = require('express-validator');

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
    console.log(err);
    return res.status(500).send({ message: String(err) });
  }
};
