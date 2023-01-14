const { customAlphabet } = require('nanoid');
const TIME_IN_MINUTES = 5;
const TEN_MINUTES_IN_MS = 1000 * 60 * TIME_IN_MINUTES
const TIME_FOR_EXPIRING = TEN_MINUTES_IN_MS;

exports.signUpValidationStorage = {
  list: {},
  add(email) {
    const nanoid = customAlphabet('1234567890ABCDEF', 5);
    const code = nanoid();

    this.list[email] = {
      code,
      expiredAt: +new Date() + TIME_FOR_EXPIRING,
    }

    setTimeout(() => {
      this.deleteAllExpired();
    }, 0);

    return {
      code,
      timeInMinutes: TIME_IN_MINUTES,
    };
  },
  isValid(email, code) {
    const record = this.list[email];

    if (!record || record.code !== code) {
      return {
        isValid: false,
        code: 'SIGNUP_WRONG_CODE_ERROR',
        message: 'Validation code for signup is wrong',
      }
    }

    if (record.expiredAt < +new Date()) {
      return {
        isValid: false,
        code: 'SIGNUP_EXPIRED_CODE_ERROR',
        message: 'Validation code is expired',
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
