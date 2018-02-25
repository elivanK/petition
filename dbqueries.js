const spicedPg = require("spiced-pg");
const db = spicedPg(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/users');

//The method to insert data to the users table
exports.insertUser = (data, hashed) => {
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO users
            (first, last, email, hashed_pass) VALUES ($1, $2, $3, $4) RETURNING id`, [data.first, data.last, data.email, hashed]
        ).then((results) => {
            resolve(results.rows[0].id);
        }).catch((err) => {
            reject(err);
        });
    });
};
exports.insertProfile = (id, data) => {
    return new Promise((resolve, reject) => {
        var query = "INSERT INTO user_profile (user_id, age, city, url) VALUES ($1,$2,$3,$4) RETURNING id";

        db.query(query, [id, data.age, data.city, data.url]).then(() => {
            resolve('success');
        }).catch((error) => {
            console.log('this is the insert Error', error);
            reject(error);
        });
    });
};

exports.checkIfSigned = (id) => {
    return new Promise((resolve, reject) => {
        var query = "SELECT signature FROM signatures WHERE user_id=$1";

        db.query(query, [id]).then((result) => {
            resolve(result.rowCount);
        }).catch((error) => {
            console.log('5     inside checkIfSigned PROMISE ', error);
            reject(error);
        });
    });
};

exports.signPetition = (id, signature) => {
    return new Promise((resolve, reject) => {
        var query = "INSERT INTO signatures (user_id, signature) VALUES ($1,$2) RETURNING id";

        db.query(query, [id, signature]).then(() => {
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
exports.getProfileInfo = (id) => {
    return new Promise((resolve, reject) => {
        var query = "SELECT users.first, users.last, users.email, user_profile.age, user_profile.city, user_profile.url FROM users LEFT JOIN user_profile ON user_profile.user_id = users.id WHERE users.id=$1";

        db.query(query, [id]).then((info) => {
            resolve(info.rows[0]);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
exports.updateUser = (data, id, hashed) => {
    return new Promise((resolve, reject) => {
        var query = "UPDATE users SET first=$1, last=$2, email=$3, hashed_pass=$4 WHERE id=$5";

        db.query(query, [data.first, data.last, data.email, hashed, id]).then((message) => {
            console.log(message);
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
exports.updateOptionals = (data, id) => {
    return new Promise((resolve, reject) => {
        var query = "UPDATE user_profile SET age=$1, city=$2, url=$3 WHERE user_id=$4";

        db.query(query, [data.age, data.city, data.url, id]).then((message) => {
            console.log(message);
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
exports.getSignature = (id) => {
    return new Promise((resolve, reject) => {
        const q = "SELECT signature FROM signatures WHERE user_id = $1";

        db.query(q, [id]).then((results) => {
            resolve(results.rows[0].signature);
        }).catch((error) => {
            console.log(error);
            reject('getSignature: rejected');
        });
    });
};
exports.deleteSignature = (id) => {
    return new Promise((resolve, reject) => {
        var query = "DELETE FROM signatures WHERE user_id=$1";

        db.query(query, [id]).then((message) => {
            console.log(message);
            resolve('success');
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
exports.signByCity = (signCity) => {
    return new Promise((resolve, reject) => {
        var query = `SELECT users.id, users.first, users.last, user_profile.age, user_profile.url 
        FROM users 
        LEFT JOIN user_profile 
        ON (users.id = user_profile.user_id) 
        JOIN signatures 
        ON (users.id = signatures.user_id) 
        WHERE LOWER (user_profile.city) = LOWER ($1)`;

        db.query(query, [signCity]).then((results) => {
            resolve(results.rows);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
    });
};
exports.countSignes = () => {
    return new Promise((resolve, reject) => {
        var query = `SELECT COUNT(signature) FROM signatures`;

        db.query(query).then((resultcount) => {
            resolve(resultcount.rows[0].count);
        });
    });
};