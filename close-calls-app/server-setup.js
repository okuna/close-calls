const bodyParser = require('body-parser');

module.exports = function(app, server, compiler) {
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());	

	app.get('/planes', (req, res) => {
		res.send('hello');
	});
}

