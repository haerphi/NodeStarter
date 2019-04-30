exports.initRoutes = function (app) {
    app.get("/", function (req, res) {
        if (req.session.user) {
            res.redirect("/home");
            return;
        }

        res.render("login.pug");
    });

    app.post("/", function (req, res) {
        let {login, password} = req.body;
        let data = {success: false, message: "This login doesn't exist !"};

        r.table("users").getAll(login, {index: "user_login"}).run(function (err, users) {
            if (err || users.length == 0) {
                res.send(JSON.stringify(data));
                return;
            }

            // Check password of user
            let user = users[0];
            let arr = user.user_password.split(':');
            let salt = arr[0], hashedpassword = arr[1];

            if (SHA256_encrypt(salt + password) == hashedpassword) {
                data.success = true;
                req.session.user = user;
            } else {
                data.message = "Wrong password";
            }

            res.send(JSON.stringify(data));
        });
    });

    app.get("/logout", function (req, res) {
        req.session.destroy(function(err) {
            res.redirect("/");
        });
    });

    app.get("/home", function (req, res) {
        if (!req.session.user) {
            res.redirect("/");
            return;
        }

        res.render("home.pug", {user: req.session.user});
    });

    app.get("/register", function (req, res) {
        if (req.session.user) {
            res.redirect("/home");
            return;
        }

        res.render("register.pug");
    });

    app.post("/register", function (req, res) {
        let firstname = req.body.firstname;
        let secondname = req.body.secondname;
        let login = req.body.login;
        let password = req.body.password;

        let data = {success: false, message: "This login already exist !"};

        r.table("users").getAll(login, {index: "user_login"}).run(function (err, users) {
            if (err || users.length == 0) {
                // Hash password
                let salt = require('randomstring').generate();
                password = salt + ':' + SHA256_encrypt(salt + password);

                r.table("users").insert({
                    user_firstname: firstname,
                    user_secondname: secondname,
                    user_login: login,
                    user_password: password
                }).run(function () {
                    data.success = true;
                    res.send(JSON.stringify(data));
                })
            } else {
                res.send(JSON.stringify(data));
            }
        });
    });

    app.get('/profil', function (req, res) {
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        res.render('profil.pug', {user: req.session.user});
    });

    app.post("/profil", function (req, res) {
        let fs = require("fs-extra");
        let sharp = require('sharp');
        sharp.cache(false);
        
    	multerHandler.fields([
    		{ name: "avatar", maxCount: 1 }
    	])(req, res, function (err) {
            let file = req.files.avatar[0];

            sharp(file.path).resize(90, 90, {fit: 'fill'}).toBuffer().then(function (buffer) {
                let encoded = base64ArrayBuffer(buffer);

                let imgData = {
                    data: encoded,
                    type: file.type
                }

                fs.unlink(file.path);

                r.table('users').get(req.session.user.id).update({user_avatar: imgData}).run(function (err) {
                    // Update session
                    req.session.user.user_avatar = imgData;

                    res.send(JSON.stringify({success: err ? false: true}));
                });
            })
    	});
    });
};

function SHA256_encrypt(data) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('base64');
};

function base64ArrayBuffer(arrayBuffer) {
    let base64    = ''
    let encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
    let bytes         = new Uint8Array(arrayBuffer)
    let byteLength    = bytes.byteLength
    let byteRemainder = byteLength % 3
    let mainLength    = byteLength - byteRemainder
  
    let a, b, c, d
    let chunk
  
    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1
  
      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }
  
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]
  
      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
  
      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4 // 3   = 2^2 - 1
  
      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
  
      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
  
      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }
    
    return base64
};