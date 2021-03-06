'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

var account = node.randomTxAccount();
var account2 = node.randomTxAccount();
var account3 = node.randomTxAccount();

function putSignature (params, done) {
	node.api.put('/signatures')
		.set('Accept', 'application/json')
		.send(params)
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			// console.log(JSON.stringify(res.body));
			done(err, res);
		});
}

function putTransaction (params, done) {
	node.api.put('/transactions')
		.set('Accept', 'application/json')
		.send(params)
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			// console.log(JSON.stringify(res.body));
			done(err, res);
		});
}

function putDelegate (params, done) {
	node.api.put('/delegates')
		.set('Accept', 'application/json')
		.send(params)
		.expect('Content-Type', /json/)
		.expect(200)
		.end(function (err, res) {
			// console.log(JSON.stringify(res.body));
			done(err, res);
		});
}

function sendLISK (account, done) {
	var randomLISK = node.randomLISK();
	var expectedFee = node.expectedFee(randomLISK);

	putTransaction({
		secret: node.gAccount.password,
		amount: randomLISK,
		recipientId: account.address
	}, function (err, res) {
		node.expect(res.body).to.have.property('success').to.be.ok;
		done(err, res);
	});
}

before(function (done) {
	setTimeout(function () {
		sendLISK(account, done);
	}, 2000);
});

before(function (done) {
	setTimeout(function () {
		sendLISK(account2, done);
	}, 2000);
});

describe('PUT /signatures', function () {

	before(function (done) {
		node.onNewBlock(done);
	});

	it('when account has no funds should fail', function (done) {
		putSignature({
			secret: account3.password,
			secondSecret: account3.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using invalid passphrase should fail', function (done) {
		putSignature({
			secret: 'account.password',
			secondSecret: account.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using no second passphrase should fail', function (done) {
		putSignature({
			secret: account.password
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using valid parameters should be ok', function (done) {
		putSignature({
			secret: account.password,
			secondSecret: account.secondPassword
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.ok;
			node.expect(res.body).to.have.property('transaction').that.is.an('object');
			if (res.body.success && res.body.transaction != null) {
				node.expect(res.body.transaction).to.have.property('type').to.equal(node.txTypes.SIGNATURE);
				node.expect(res.body.transaction).to.have.property('senderPublicKey').to.equal(account.publicKey);
				node.expect(res.body.transaction).to.have.property('senderId').to.equal(account.address);
				node.expect(res.body.transaction).to.have.property('fee').to.equal(node.fees.secondPasswordFee);
			}
			done();
		});
	});
});

describe('PUT /transactions from account with second signature enabled', function () {

	before(function (done) {
		node.onNewBlock(done);
	});

	it('using no second passphase should fail', function (done) {
		var amountToSend = 100000000;

		putTransaction({
			secret: account.password,
			recipientId: account2.address,
			amount: amountToSend
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});

	it('using second passphase but no primary passphase should fail', function (done) {
		var amountToSend = 100000000;

		putTransaction({
			secondSecret: account.secondPassword,
			recipientId: account2.address,
			amount: amountToSend
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});
});

describe('PUT /delegates from account with second signature enabled', function () {

	it('using no second passphase should fail', function (done) {
		putDelegate({
			secret: account.password,
			username: account.delegateName
		}, function (err, res) {
			node.expect(res.body).to.have.property('success').to.be.not.ok;
			node.expect(res.body).to.have.property('error');
			done();
		});
	});
});
