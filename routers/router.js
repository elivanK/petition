//modules
const express = require('express');
const router = express.Router();
const dbq = require('../dbqueries.js');
const session = require('express-session');
const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/users');
const bcrypt = require('bcryptjs');
const csrf = require('csurf');

router.use(csrf({
    cookie: true
}));
//Set the homepage to Register page
router.route('/')
    .get((req, res) => {
        res.redirect('/register');
    });
//The register page
router.route('/register')
    .get((req, res) => {
        res.render('register', {
            layouts: 'main',
            csrfToken: req.csrfToken()
        });
    })

.post((req, res) => {
    console.log('Inside the POST /');

    hashPassword(req.body.password)
        .then(hashedPassword => {
            dbq.insertUser(req.body, hashedPassword)
                .then((id) => {
                    req.session.user = {
                        first: req.body.first,
                        last: req.body.last,
                        email: req.body.email,
                        password: hashedPassword,
                        id: id,
                        signed: false
                    };
                    res.redirect('/profile');
                }).catch((err) => {
                    console.log(err);
                    res.render('register', {
                        layouts: 'main',
                        error: "Something went wrong, maybe email already exists, please try again",
                        csrfToken: req.csrfToken()
                    });
                });

        });
});
//The profile page
router.route('/profile')
    .get((req, res) => {
        res.render('profile', {
            layout: 'main',
            csrfToken: req.csrfToken()
        });
    })
    .post((req, res) => {

        dbq.insertProfile(req.session.user.id, req.body)
            .then((message) => {
                console.log(message);
                res.redirect('/petition');
            }).catch((err) => {
                console.log(err);
            });
    });

//The login homepage
router.route('/login')
    .get((req, res) => {
        res.render('login', {
            layouts: 'main',
            csrfToken: req.csrfToken()
        });
    })
    .post((req, res) => {
        const { email, password } = req.body;
        const q = 'SELECT * From users WHERE email=$1'
        const params = [email];

        db.query(q, params).then((results => {
            //Check if email exists
            checkPassword(password, results.rows[0].hashed_pass)
                .then((doesMatch => {
                    if (!doesMatch) {
                        res.render('login', {
                            layouts: main,
                            errorMessage: 'Something went wrong with your login',
                            csrfToken: req.csrfToken()
                        });
                    } else if (doesMatch) {
                        req.session.user = {
                            first: results.rows[0].first,
                            last: results.rows[0].last,
                            id: results.rows[0].id,
                            email: results.rows[0].email,
                            signed: undefined
                        };
                        dbq.checkIfSigned(results.rows[0].id).then((result) => {
                            if (result === 1) {
                                req.session.user.signed = true;
                                res.redirect('/thanks');
                            } else {
                                req.session.user.signed = false;
                                res.redirect('/petition');
                            }
                        }).catch((err) => {
                            console.log(err);
                            res.render('/login', {
                                csrfToken: req.csrfToken(),
                                layouts: 'main',
                                errorMessage: 'Can not find user with matching password and email'
                            })
                        })
                    }

                }))
        }))
    });
//The Petition page
router.route('/petition')
    .get((req, res) => {
        res.render('petition', {
            layouts: 'main',
            csrfToken: req.csrfToken()
        });
    })
    .post((req, res) => {

        dbq.signPetition(req.session.user.id, req.body.signature)
            .then(() => {
                req.session.user.signed = true;
                res.redirect('/thanks');
            }).catch((err) => {
                console.log(err);
            });
    })
    //The Thank you page
router.route('/thanks')
    .get((req, res) => {
        //Calling the methods that count and get the signature
        dbq.countSignes().then((resultcount) => {
            dbq.getSignature(req.session.user.id)
                .then((results) => {
                    res.render('thanks', {
                        layouts: 'main',
                        count: resultcount,
                        signatureUrl: results,
                        csrfToken: req.csrfToken()
                    });
                });
        });
    });
//For the delete option
router.route('/delete')
    .post((req, res) => {
        dbq.deleteSignature(req.session.user.id)
            .then((message) => {
                req.session.user.signed = false;
                console.log('Your signautre is deleted');
                res.redirect('/petition');
            }).catch((err) => {
                console.log(err);
            });
    });
//Edit profile
router.route('/edit')
    .get((req, res) => {
        dbq.getProfileInfo(req.session.user.id)
            .then((info) => {
                res.render('edit', {
                    layouts: 'main',
                    info: info,
                    csrfToken: req.csrfToken()
                })
            }).catch((err) => {
                console.log(err);
            });
    })
    .post((req, res) => {
        console.log('Posting edit');
        console.log(req.body.password);
        hashPassword(req.body.password).then((hashedPassword) => {
            dbq.updateUser(req.body, req.session.user.id, hashedPassword)
                .then(() => {
                    dbq.updateOptionals(req.body, req.session.user.id)
                        .then(() => {
                            res.redirect('/thanks');
                        }).catch((err) => {
                            console.log(err);
                        });
                });
        });
    });
//The signers 
router.route('/signers')
    .get((req, res) => {
        db.query(
            `SELECT users.first, users.last, user_profile.age, user_profile.city, user_profile.url 
        FROM users 
        INNER JOIN user_profile 
        ON user_profile.user_id = users.id 
        INNER JOIN signatures 
        ON user_profile.user_id = signatures.user_id`)

        .then((results) => {
            res.render('signers', {
                layouts: 'main',
                list: results.rows
            });
        }).catch((err) => {
            console.log(err);
        });
    });

//By city
router.route('/signers/:city')

.get((req, res) => {
    dbq.signByCity(req.params.city)
        .then((result) => {
            console.log(result);
            res.render('city', {
                layouts: 'main',
                signCity: result
            })
        })
})

//The logout 
router.get('/logout', (req, res) => {
    console.log('You are logging out');
    //req.session.destroy;
    req.session.user = null;
    res.redirect('/register');
});
router.get('/back', (req, res) => {
    console.log('You are now in back the signers page');
    res.redirect('/thanks');
});
//#######################################################

function hashPassword(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
}

function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
            if (err) {
                reject(err);
            } else {
                resolve(doesMatch);
            }
        });
    });
}
//######################################If all other re routing fails
/********************** IF ALL OTHER RE-ROUTING FAILS **********************/
router.get('*', (req, res) => {
    res.redirect('/register');
});

module.exports = router;