exports.accessTokenBlackListStorage = {
  list: {},
  isInList(accessToken) {
    return !!this.list[accessToken];
  },
  add(accessToken, timeForExpiringInMs) {
    this.list[accessToken] = +new Date() + timeForExpiringInMs;

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
