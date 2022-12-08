const db = require('../models');
const User = db.user;
const Role = db.role;
const Session = db.session;
const bcrypt = require('bcryptjs');
const { resolve500Error } = require('./../middlewares/validation');
const { createPasswordHash, createNewSession, logout } = require('./actions/auth.actions');
const { resetPasswordStorage } = require('./../storage/auth/resetPassword.storage');
const { signUpValidationStorage } = require('./../storage/auth/signUpValidation.storage');
const { sendEmail } = require('./../services/email');
const { RESET_PASSWORD_CODE_DURATION_MINUTES } = require('./../config');

exports.validateEmailForSignUp = (req, res) => {
  const { email } = req.body;

  const { code, timeInMinutes } = signUpValidationStorage.add(email);

  sendEmail({
    to: email,
    subject: 'Confirmation email for registration in Idli',
    body: `Your validation code for registration is <big>${code}</big><br/>
It will be valid for ${timeInMinutes} minutes.`,
    isHtml: true,
  });

  return res.status(200).send({
    message: 'The email is send. Check you mailbox.',
    codeLifetimeInMinutes: timeInMinutes,
  });
}

exports.signup = (req, res) => {
  const now = new Date();
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: createPasswordHash(req.body.password),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  user.save((err, user) => {
    resolve500Error(err, res);
    
    if (req.body.roles) {
      const parsedRoles = JSON.parse(req.body.roles);

      Role.find(
        { name: { $in: parsedRoles } },
        (err, roles) => {
          resolve500Error(err, res);

          user.roles = roles.map(role => role._id);
          user.save(err => {
            resolve500Error(err, res);

            res.status(200).send({ message: 'User successfully created' });
          })
        },
      )
    } else {
      Role.findOne(
        { name: 'user' },
        (err, role) => {
        resolve500Error(err, res);

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
          }

          res.status(200).send({ message: 'User successfully created' });
        })
      });
    }
  })
};

exports.signin = async (req, res) => {
  try {
    const searchOption = req.body.username
      ? { username: req.body.username }
      : req.body.email
        ? { email: req.body.email }
        : null
    const user = await User.findOne(searchOption)
      .populate({
        path: 'roles',
        model: Role,
        select: '-__v',
      });

    if (!user) {
      return res.status(404).send({
        code: 'NOT_FOUND_USER_ERROR',
        message: 'User not found',
      });
    }

    const isPasswordValid = bcrypt.compareSync(
      req.body.password,
      user.password,
    );
    
    if (user.deletedAt) {
      return res.status(410).send({
        accessToken: null,
        code: 'DELETED_USER_ERROR',
        message: 'User was deleted',
      });
    }

    if (!isPasswordValid) {
      return res.status(404).send({
        accessToken: null,
        code: 'CREDENTIALS_ERROR',
        message: 'Invalid credentials',
      });
    }

    const {
      accessToken,
      refreshToken,
      authorities,
    } = await createNewSession(user, req.body.fingerprint);

    return res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.refresh = async (req, res) => {
  try {
    const session = await Session.findOne({ accessToken: req.body.accessToken });
    const isCorrectFingerprint = session?.fingerprint === req.body.fingerprint;
    const isCorrectExpiration = +session?.refreshExpiredAt > +new Date();
    const isCorrectRefreshToken = session?.refreshToken === req.body.refreshToken;

    const isValid = isCorrectFingerprint
      && isCorrectExpiration
      && isCorrectRefreshToken;
    const isWrongSensitiveThing = !isCorrectFingerprint || !isCorrectRefreshToken;

    if (isValid) {
      const user = await User.findById(session.userId)
        .populate({
          path: 'roles',
          model: Role,
          select: '-__v',
        });

      const {
        accessToken,
        refreshToken,
      } = await createNewSession(user, req.body.fingerprint);

      await session.remove();

      return res.status(200).send({
        accessToken,
        refreshToken,
      });
    } else if (isWrongSensitiveThing) {
      return res.status(400).send({
        code: 'REFRESH_TOKEN_WRONG_ERROR',
        message: 'Refresh token is invalid',
      });
    } else if (!isCorrectExpiration) {
      return res.status(400).send({
        code: 'REFRESH_TOKEN_EXPIRED_ERROR',
        message: 'Refresh token is expired',
      });
    }
  } catch (err) {
    resolve500Error(err, res);
  }
}

exports.changePassword = async (req, res) => {
  try {
    const {
      accessToken,
      refreshToken,
      fingerprint,
      isLogoutFromAllDevices,
      email,
    } = req.body;
    const user = await User.findOne({ email });

    const isPasswordValid = bcrypt.compareSync(
      req.body.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).send({
        code: 'WRONG_CURRENT_PASSWORD_ERROR',
        message: 'The old password is incorrect',
      });
    }

    const newPassword = createPasswordHash(req.body.newPassword);

    user.password = newPassword;

    await user.save();

    if (isLogoutFromAllDevices) {
      logout({
        accessToken,
        refreshToken,
        fingerprint,
        userId: String(user._id),
        mode: 'allExceptCurrent',
        res,
      }).then(({ message }) => {
        return res.status(200).send(message);
      }).catch(({ message }) => {
        return res.status(400).send(message);
      });
    }

    return res.status(200).send('Password is successfully changed');
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.requestResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (user) {
      const { code } = resetPasswordStorage.add(user.email);

      sendEmail({
        to: req.body.email,
        subject: 'Reset password',
        body: `Your validation code is <big>${code}</big>
It will be valid for ${RESET_PASSWORD_CODE_DURATION_MINUTES} minutes. Your username: ${user.username}`,
        isHtml: true,
      });
    }

    return res.status(200).send({
      message: `The request is approved. Check your email for a link.
The validation code will be valid for ${RESET_PASSWORD_CODE_DURATION_MINUTES} minutes`,
      codeLifetimeInMinutes: RESET_PASSWORD_CODE_DURATION_MINUTES,
    });
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const { isValid, code, message } = resetPasswordStorage.isValid(req.body.email, req.body.code);

      if (isValid) {
        user.password = createPasswordHash(req.body.password);

        await user.save();

        logout({
          userId: String(user._id),
          isNoTokensMode: true,
          mode: 'all',
          res,
        }).then(({ message }) => {
          return res.status(200).send(message);
        }).catch(() => {
          console.log('No valid mode');

          return res.status(500).send('Something go wrong');
        });

        resetPasswordStorage.delete(req.body.email);

        return res.status(200).send('The password is succesfully changed');
      } else {
        return res.status(400).send({
          code,
          message,
        });
      }
    } else {
      return res.status(400).send('The request is invalid.');
    }
  } catch (err) {
    resolve500Error(err, res);
  }
};

exports.logout = async (req, res) => {
  const {
    userId,
    accessToken,
    refreshToken,
    mode,
    fingerprint,
  } = req.body;

  logout({
    userId,
    accessToken,
    refreshToken,
    mode,
    fingerprint,
    res,
  }).then(({ message }) => {
    return res.status(200).send({ message });
  }).catch(({ message }) => {
    return res.status(400).send({ code: 'LOGOUT_ERROR', message });
  });
}
