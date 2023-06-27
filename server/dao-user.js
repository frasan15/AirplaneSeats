'use strict';

//Data Access Object (DAO) module for accessing user data

const db = require('./db');
const crypto = require('crypto');

//this functions returns user's information given its id.
exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM user WHERE id=?';
        db.get(sql, [id], (err, row) => {
            if(err){
                reject(err);
            }
            else if(row === undefined){
                resolve({error: 'user not found'});
            }else{
                const user = {id: row.id, email: row.email};
                resolve(user);
            }
        })
    })
};

//this function is used at log-in time to verify username and password.
exports.getUser = (email, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM user WHERE email=?';
        db.get(sql, [email], (err, row) => {
            if(err){
                reject(err);
            }
            else if(row === undefined){
                resolve({error: 'user not found'});
            }
            else {
                const user = {id: row.id, email: row.email};
                //Check the hashes with an async call
                crypto.scrypt(password, row.salt, 32, function(err, hashedPassword){
                    if(err){
                        reject(err);
                    }
                    if(!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)){
                        resolve({error: 'wrong email or password'})
                    }else{
                        resolve(user);
                    }
                })
            }
        })
    })
}