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

    app.post('/api/getPlanes', (req, res, next) => {
        let lat = req.body.data.lat;
        let lon = req.body.data.lon;
        let latUpper = lat + 1;
        let latLower = lat - 1;
        let lonUpper = lon + 1;
        let lonLower = lon - 1;
        console.log(lat, lon);
        //let query = connection.query('SELECT * FROM planes WHERE (planes.latitude BETWEEN ? and ?) and (planes.longitude BETWEEN ? and ?) LIMIT 10000', [latLower, latUpper, lonLower, lonUpper],(error, results, fields) => {
        let query = connection.query('SELECT *, COUNT(*) as NumPoints FROM close_calls GROUP BY Icao, _Icao ORDER BY `Distance` ASC LIMIT 10000', (error, results, fields) => {
            if (error) next(error);
            res.send(results);
        });
        console.log(query.sql);
    });

    app.post('/api/getPlaneHistory', (req, res, next) => {
        let icao1 = req.body.data.icao1;
        let icao2 = req.body.data.icao2;
        let query = connection.query('SELECT * FROM close_calls WHERE `Icao` = ? and `_Icao` = ?', [icao1, icao2], (error, results, fields) => {
            if (error) next(error);
            res.send(results);
        });
        console.log(query.sql);
    });
}

