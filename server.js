// Require everything needed
let express = require("express");
let bodyParser = require("body-parser");
let session = require("express-session");
let multer = require("multer");
let path = require("path");

require('./config/rethinkdb');
require('./config/server');

let routes = require('./routes');

require('./rethinkdb/rethinkdb');

// Express config
const app = express();
app.use(express.static(__dirname + "/public"));
app.locals.basedir = path.join(__dirname);
app.set('view engine', 'pug');
app.set("views", __dirname + "/views");
app.use(
	session({
		secret: "Rz3+47\"VtV623fjN",
		resave: false,
		saveUninitialized: true
	})
);
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));

// Debug config
debugDefault = require('debug')('worker:debugDefault');
debugRethinkDB = require('debug')('worker:debugRethinkDB');

// Config logs
app.use(function (req, res, next) {
    debugDefault("headers.host: ", "http://" + req.headers.host + "/");
    debugDefault("req.originalUrl: ", req.originalUrl);
    debugDefault("req.params: ", req.params);
    debugDefault("req.body: ", req.body);
    next();
});

// Multer config
let storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, "./public/img");
	},
	filename: function(req, file, callback) {
		callback(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	}
});

multerHandler = multer({
	storage: storage,
	limits: {
		fileSize: 15 * 1024 * 1024,
		fieldSize: 500 * 1024 * 1024
	}
});

// Routing
routes.initRoutes(app);

// 404 routing
app.use(function (req, res, next) {
	res.render('404.pug');
});

app.listen(Number(config_server.port));

debugDefault('Server listening on ' + config_server.protocol + '://' + config_server.ip + ':' + config_server.port + '/');