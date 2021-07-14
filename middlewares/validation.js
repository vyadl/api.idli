const { validationResult } = require('express-validator');

exports.verifyBasicValidation = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    const firstError = validationResult(req).errors[0];

    res.status(400).send({
      message: `${firstError.param !== '_error'
        ? firstError.param + ' - '
        : ''}${firstError.msg}`
      });

    return;
  }

  next();
};

exports.resolve500ErrorInContoller = (err, req, res) => {
  if (err) {
    res.status(500).send({ message: err });
    return;
  }
};
