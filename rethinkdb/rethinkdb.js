r = require('rethinkdbdash')({
    pool: true,
    cursor: false,
    silent: true,
    db: config_rethink.name,
    user: 'admin',
    password: config_rethink.password,
    discovery: true,
    servers: [
        {
            host: config_rethink.host,
            port: config_rethink.driver_port
        }
    ]
});

debugRethinkDB = require('debug')('worker:debugRethinkDB');

exports.start = function (callback) {
    let child = require('child_process');

    let command = process.platform == 'linux' ? 'rethinkdb' : '"' + __dirname + '/rethinkdb.exe"';
    let dataDir = __dirname + config_rethink.data;
    let http_port = config_rethink.http_port;
    let driver_port = config_rethink.driver_port;
    let cluster_port = config_rethink.cluster_port;

    let cmd = command + ' --directory "' + dataDir + '" --bind 127.0.0.1 '
                        + ' --driver-port ' + driver_port + ' --cluster-port ' + cluster_port + ' --initial-password "' + config_rethink.password + '" --http-port ' + http_port;
    
    let error = false;

    child.exec(cmd, function (error, stdout, stderr) {
        if (error != null) {
            debugRethinkDB('Error: ' + error);
            error = true;
        }
    });

    setTimeout(function () {
        if (!error) {
            debugRethinkDB("Database started and listening on http://localhost:8080");
            callback();
        }
    }, 1500);
};

exports.init = function (callback) {
    debugRethinkDB("Create table users");

    r.dbDrop('test').run(function () {});
    r.dbCreate(config_rethink.name).run(function (err) {
        r.tableCreate('users').run(function (err) {
            debugRethinkDB("Create index user_login on table users");
            r.table('users').indexCreate('user_login').run(function () {
                callback();
            });
        });
    });
};