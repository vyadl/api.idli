const test = require('ava');
const request = require('supertest');
const createApp = require('./../server');
const { testUser: { username, password, email } } = require('../config/test.config');
const { user: User } = require('./../models');
const { signIn } = require('./utils');

createApp().then(async app => {
	let userId = '';
	const user = await signIn(app);
	const admin = await signIn(app, true);

	test.serial('sign up', async t => {
		const res = await request(app)
			.post('/api/auth/signup')
			.send({
				username,
				email,
				password,
			});

    t.is(res.status, 200);
	});
	
	test.serial('sign in', async t => {
		const {
			status,
			body: { username: usernameRes, email: emailRes, id },
		} = await request(app)
			.post('/api/auth/signin')
			.send({
				username,
				password,
			});

    t.is(status, 200);
    t.is(usernameRes, username);
		t.is(emailRes, email);

		userId = id;
	});

	test.serial('delete user', async t => {

		await User.findByIdAndDelete(userId);

		const { status, body } = await request(app)
			.post('/api/auth/signin')
			.send({
				username,
				password,
			});

    t.is(status, 404);
	});

	test('sign in test users', async t => {
		t.is(user.roles[0], 'ROLE_USER');
		t.is(admin.roles[0], 'ROLE_ADMIN');
	});
});
