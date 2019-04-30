require('./config/rethinkdb');
let rethink = require('./rethinkdb/rethinkdb');

rethink.start(function () {
    rethink.init(function () {
        debugRethinkDB("Database running ! CTRL+C to stop");
    })
});