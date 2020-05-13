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

async function execSql(sql, param) {
    const promisePool = pool.promise();
    let [rows] = await promisePool.query(sql, param);
    return [rows];
}

module.exports = {
    execSql
};


/*
pool.getConnection(function(err, connection) {
    if(err){
        console.log("建立连接失败");
    } else {
        console.log("建立连接成功");
        console.log(pool._allConnections.length); //  1
        connection.query('select * from user', function(err, rows) {
            if(err) {
                console.log("查询失败");
            } else {
                console.log(rows);
            }
            // connection.destroy();
            connection.release();
            console.log(pool._allConnections.length);  // 0
        })
    }
    // pool.end();
})*/

// execSql('SELECT * FROM WORK_INFO WHERE model LIKE ?', ['m20s' + '%']);