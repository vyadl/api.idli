const { customAlphabet } = require('nanoid');
const { RESET_PASSWORD_CODE_DURATION_MINUTES } = require('./../../config');
const TIME_IN_MINUTES = RESET_PASSWORD_CODE_DURATION_MINUTES;
const FIVE_MINUTES_IN_MS = 1000 * 60 * TIME_IN_MINUTES;
const TIME_FOR_EXPIRING = FIVE_MINUTES_IN_MS;

exports.resetPasswordStorage = {
  list: {},
  add(email) {
    const nanoid = customAlphabet('1234567890ABCDEF', 10);
    const code = nanoid();

    this.list[email] = {
      code,
      expiredAt: +new Date() + TIME_FOR_EXPIRING,
    }

    setTimeout(() => {
      this.deleteAllExpired();
    }, 0);

    return { code };
  },
  isValid(email, code) {
    const record = this.list[email];

    if (!record || record.code !== code) {
      return {
        isValid: false,
        code: 'RESET_PASSWORD_WRONG_CODE_ERROR',
        message: 'Validation code for reset password is wrong'
      }
    }

    if (record.expiredAt < +new Date()) {
      return {
        isValid: false,
        code: 'RESET_PASSWORD_EXPIRED_CODE_ERROR',
        message: 'Validation code for reset password is expired'
      }
    }

    return { isValid: true };
  },
  delete(email) {
    if (this.list[email]) {
      delete this.list[email];
    } else {
      throw new Error('there is no such email for reseting in the list');
    }
  },
  deleteAllExpired() {
    const now = +new Date();

    for (let key in this.list) {
      if (this.list[key].expiredAt < now) {
        delete this.list[key];
      }
    }
  }
};
