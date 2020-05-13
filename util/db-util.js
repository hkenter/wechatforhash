const mysql = require('mysql2');
let iniParser = require('iniparser');
let config = iniParser.parseSync('./resource/config.ini');

const pool = mysql.createPool({
    host: config['DB']['host'],
    user: config['DB']['user'],
    database: config['DB']['database'],
    password: config['DB']['password'],
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});