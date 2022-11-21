const { ACCESS_TOKEN_LIFETIME } = require('./../../controllers/actions/auth.actions');
const TIME_FOR_EXPIRING = ACCESS_TOKEN_LIFETIME;

exports.accessTokenBlackList = {
  list: {},
  isInList(accessToken) {
    return !!this.list[accessToken];
  },
  add(accessToken) {
    this.list[accessToken] = +new Date() + TIME_FOR_EXPIRING;

    setTimeout(() => {
      this.deleteAllExpired();
    }, 0);

    return accessToken;
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
      if (this.list[key] < now) {
        delete this.list[key];
      }
    }
  }
};
