const bodyParser = require('body-parser');
const config = require('./mysql-config');

const mysql = require('mysql');

module.exports = function(app, server, compiler) {
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());	

	const connection = mysql.createConnection({
		host: 'localhost',
		user: config.username,
		password: config.password,
		database: 'airplanes'
	});

	app.post('/api/getPlanes', (req, res) => {
        let lat = req.body.data.lat;
        let lon = req.body.data.lon;
        let latUpper = lat + 1;
        let latLower = lat - 1;
        let lonUpper = lon + 1;
        let lonLower = lon - 1;
        console.log(lat, lon);
        let query = connection.query('SELECT * FROM planes WHERE (planes.latitude BETWEEN ? and ?) and (planes.longitude BETWEEN ? and ?) LIMIT 10000', [latLower, latUpper, lonLower, lonUpper],(error, results, fields) => {
            if (error) throw error;
			res.send(results);
		});
    console.log(query.sql);
	});
}

