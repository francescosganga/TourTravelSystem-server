var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var config = require('../config');
var router = express.Router();
var assert = require('assert');

router.get('/', function(req, res, next) {
	var error = {'status': false};
	var result = {'status': true};

	var query = {
		$and: []
	};

	//check if mandatory variables exist
	if(req.query.apiKey === undefined)
		error.error = 'mandatory fields missing';

	//check if apiKey lenght is 32
	if(req.query.apiKey.length != 32)
		error.error = 'apiKey is not valid';

	//assign variables - city, country, hotel, transfer
	if(req.query.city !== undefined)
		query.$and.push({"destination.city": req.query.city});
	if(req.query.country !== undefined)
		query.$and.push({"destination.country": req.query.country});
	if(req.query.hotel !== undefined)
		query.$and.push({"hotel.included": req.query.hotel});
	if(req.query.transfer !== undefined)
		query.$and.push({"transfer.included": req.query.transfer});

	if(query.$and.length == 0)
		query = {};

	if(Object.keys(error).length == 1) {
		url = "mongodb://" + config.mongodb.host + ":" + config.mongodb.port;
		MongoClient.connect(url, function(err, client) {
			assert.equal(null, err);
	 
			const db = client.db(config.mongodb.db);
			const collection = db.collection('affiliates');
			collection.find({apiKey: req.query.apiKey, permissions: {tours: true}}).toArray(function(err, data) {
				assert.equal(err, null);
				if(data.length == 0) {
					error.error = 'apikey not found or apiKey have not requred permissions';
					res.status(500);
					res.send(error);
				} else {
					const collection = db.collection('tours');
					collection.find({
						$and: [
							query
						]
						}).toArray(function(err, data) {
						assert.equal(err, null);
						result.data = data;
						res.status(200);
						res.send(result);
					});
				}
			});
	 
			//client.close();
		});
	} else {
		res.status(500);
		res.send(error);
	}
});

module.exports = router;
