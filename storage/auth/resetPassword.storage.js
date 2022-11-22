const { customAlphabet } = require('nanoid');
const TIME_IN_MINUTES = 5;
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

    return {
      code,
      timeInMinutes: TIME_IN_MINUTES,
    };
  },
  isValid(email, code) {
    const record = this.list[email];

    if (record && record.code === code && record.expiredAt > +new Date()) {
      return true;
    }

    return false;
  },
  delete(email) {
    console.log('in delete');
    console.log(this.list);
    console.log(email);

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
