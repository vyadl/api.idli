const Session = require('../../models/session.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const { resolve500Error } = require('./../../middlewares/validation');
const { accessTokenBlackListStorage } = require('./../../storage/auth/accessTokenBlackList.storage');
const TEN_MINUTES_IN_MS = 1000 * 60 * 10;
const MINUTE_IN_MS = 1000 * 60;
const MONTH_IN_MS = 1000 * 60 * 60 * 24 * 30;
const HALF_AN_HOUR_IN_SEC = 60 * 30;
const REFRESH_TOKEN_LIFETIME = TEN_MINUTES_IN_MS;
const ACCESS_TOKEN_LIFETIME = MINUTE_IN_MS;
exports.ACCESS_TOKEN_LIFETIME = ACCESS_TOKEN_LIFETIME;

const createPasswordHash = (password) => {
  return bcrypt.hashSync(password, 8);
}

const createNewSession = async (user, fingerprint) => {
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.SECRET_AUTH_KEY,
    { expiresIn: Math.round(ACCESS_TOKEN_LIFETIME / 1000) },
  );
  const refreshToken = nanoid();
  const authorities = [];

  for (let i = 0; i < user.roles.length; i++) {
    authorities.push(`ROLE_${user.roles[i].name.toUpperCase()}`);
  }

  const session = new Session({
    userId: String(user._id),
    email: user.email,
    fingerprint: fingerprint,
    accessToken,
    refreshToken,
    refreshExpiredAt: +new Date() + REFRESH_TOKEN_LIFETIME,
    createdAt: +new Date(),
  });

  await session.save();

  return { accessToken, refreshToken, authorities };
}

const checkIsSessionValid = async ({ userId, accessToken, refreshToken, fingerprint }) => {
  const session = await Session.findOne({ accessToken });

  const isValid = session.userId === userId
    && session.refreshToken === refreshToken
    && session.fingerprint === fingerprint;

  return {
    currentSession: session,
    isValid,
  };
}

const logout = async ({
  userId,
  accessToken,
  refreshToken,
  fingerprint,
  mode,
  isNoTokensMode = false,
  res,
}) => {
  const modeMessages = {
    'all': 'You are succesully logged out from all devices',
    'allExceptCurrent': 'You are logged out from all other devices',
    'current': 'You are successfully logged out.'
  };

  try {
    if (isNoTokensMode) {
      if (mode !== 'all') {
        return Promise.reject();
      }

      const sessions = await Session.find({ userId });

      sessions.forEach(session => {
        accessTokenBlackListStorage.add(session.accessToken, ACCESS_TOKEN_LIFETIME);
      });

      await sessions.remove();

      return Promise.resolve({ message: modeMessages.all });
    } else {
      const { isValid, currentSession }
        = await checkIsSessionValid({ userId, accessToken, refreshToken, fingerprint });

      if (isValid) {
        if (mode === 'allExceptCurrent') {
          const sessions = (await Session.find({ userId })).filter(session => {
            return String(session._id) !== String(currentSession._id);
          });

          sessions.forEach(session => {
            accessTokenBlackListStorage.add(session.accessToken, ACCESS_TOKEN_LIFETIME);
          });

          await Session.deleteMany({
            _id: { $in: sessions.map(session => session._id) }
          });
        }
        
        if (['all', 'current'].includes(mode)) {
          accessTokenBlackListStorage.add(currentSession.accessToken, ACCESS_TOKEN_LIFETIME);

          await currentSession.remove();
        }

        return Promise.resolve({ message: modeMessages[mode] });
      } else {
        return Promise.reject({ message: 'The data is invalid' });
      }
    }
  } catch (err) {
    resolve500Error(err, res);
  }
}

module.exports = {
  createPasswordHash,
  createNewSession,
  checkIsSessionValid,
  logout,
}
