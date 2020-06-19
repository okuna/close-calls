const bodyParser = require('body-parser');
const config = require('./mysql-config');

const mysql = require('mysql');

const moment = require('moment');

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
        let time = req.body.data.time;
        let startTime = moment();
        let endTime = moment();
        if (time == "all") {
            startTime = 0;
            endTime = moment().unix();
        }
        else {
            startTime = moment(time).utc().startOf('day').unix();
            endTime = moment(time).utc().endOf('day').unix();
        }
        let latUpper = lat + 1;
        let latLower = lat - 1
        let lonUpper = lon + 1;
        let lonLower = lon - 1;
        console.log(lat, lon, time);
        let query = connection.query('SELECT *, COUNT(*) as NumPoints FROM close_calls WHERE (close_calls.Lat BETWEEN ? and ?) and (close_calls.Long BETWEEN ? and ?) and (close_calls.PosTime BETWEEN ? and ?) GROUP BY Icao, _Icao ORDER BY `Distance` ASC LIMIT 10000', [latLower, latUpper, lonLower, lonUpper, startTime, endTime],(error, results, fields) => {
        //let query = connection.query('SELECT *, COUNT(*) as NumPoints FROM close_calls GROUP BY Icao, _Icao ORDER BY `Distance` ASC LIMIT 10000', (error, results, fields) => {
            if (error) next(error);
            res.send(results);
        });
        console.log(query.sql);
    });

    app.post('/api/getPlaneHistory', (req, res, next) => {
        let icao1 = req.body.data.icao1;
        let icao2 = req.body.data.icao2;
        let query = connection.query('SELECT * FROM close_calls WHERE `Icao` = ? and `_Icao` = ? order by `PosTime` asc', [icao1, icao2], (error, results, fields) => {
            if (error) next(error);
            res.send(results);
        });
        console.log(query.sql);
    });

    app.post('/api/getPlaneByCall', (req, res, next) => {
        let s = req.body.data.call;
        let query = connection.query('SELECT * FROM close_calls WHERE `Icao` = ? OR `_Icao` = ? OR `Call` = ? OR `_Call` = ? OR `Reg` = ? or `_Reg` = ?', [s, s, s, s, s, s,], (error, results, fields) => {
            if (error) next(error);
            res.send(results);
        });
        console.log(query.sql);
    });
}

