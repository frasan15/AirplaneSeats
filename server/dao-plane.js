'use strict'

// Data Access Object (DAO) module for accessing films data

const db = require('./db');

//this functions retrieves the whole list of seats of the selected plane type

exports.listSeats = (type) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE type=?';
        db.all(sql, [type], (err, rows) => {
            if (err) {
                reject(err);
            }
        resolve(rows);
        })
    })
};

//this functions returns all the reservations performed by the same user; TODO: it could be useful to also check 
//if the these reservations belongs to the same plane
exports.listSeatsByUser = (userEmail) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE userEmail=?';
        db.all(sql, [userEmail], (err, rows) => {
            if(err){
                reject(err);
            }
        resolve(rows);
        })
    })
}

//this functions is useful to check if the specified seat is still available.
//it returns true if the seat is occupied, false otherwise.
exports.isOccupied = (rowId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT userEmail FROM plane WHERE rowId=?'
        db.get(sql, [rowId], (err, userEmail) => {
            if(err){
                reject(err);
            }
        if(userEmail === null){
            resolve(false);
        }
        resolve(true);
        })
    })
};

//this function checks if the specified user is the same owner of the requested seat
//it returns true if the user is authorized, false otherwise.
exports.isAuthorized = (rowId, userEmail) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT userEmail FROM plane WHERE rowId=?'
        db.get(sql, [rowId], (err, row) => {
            if(err){
                reject(err);
            }
            if(row.userEmail === userEmail){
                resolve(true);
            }
            resolve(false)
        })
    })
};

//this function checks if the specified user already owns other reservations on other planes
//if so, it returns an error, otherwise it returns null
exports.hasAlreadyReservations = (userEmail, type) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE userEmail=? AND type<>?'
        db.all(sql, [userEmail, type], (err, rows) => {
            if(err){
                reject(err);
            }
            if(rows.length > 0){
                resolve({error: "the specified user already owns reservations on other planes"});
            }
            resolve(null);
        })
    })
};

//this function receives the triplet row-seat-type, then it returns the rowId of the function
exports.getSeatByTriplet = (row, seat, type) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE row=? AND seat=? AND type=?'
        db.get(sql, [row, seat, type], (err, row)=> {
            if(err){
                reject(err);
            }
            if(row === undefined){
                resolve({error: "seat not found"});
            }
            resolve(row.rowId);
        })
    })
};

//this function checks if there are enough seats, given by the 'number' parameter, for the request plane
//if there are enough seats then it returns the first 'number' available seats, each of them given
//by its rowId; it returns an empty array otherwise
exports.getFirstFreeSeats = (type, number) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT rowId, COUNT(*) AS tot FROM plane WHERE type=? AND userEmail=?'
        db.all(sql, [type, null], (err, rows) => {
            if(err){
                reject(err);
            }
            if(rows[1].tot >= number){
                const index = 0;
                const result = rows.map(row => {
                    if(index < number){
                        index++;
                        return row.rowId
                    }
                });
                resolve(result);
            }
            resolve([])
        })
    })
};

//this functions creates a reservation on a single seat; the userEmail param represents the user who performed the
//reservation. It returns the updated row by returning its own rowId
exports.addReservation = (userEmail, rowId) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE plane SET userEmail=? WHERE rowId=?';
        db.run(sql, [userEmail, rowId], function (err) {
            if(err){
                reject(err);
            }

            if(this.changes !== 1){
                resolve({error: "No reservation was added."})
            }else{
                resolve(rowId)
            }
        })
    })
};

//this function deletes a reservation on a single seat; the userEmail param represents the user who is trying to
//delete his own reservation; that value must be turned into NULL. It returns the updated row
exports.deleteReservation = (userEmail, rowId) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE plane SET userEmail=? WHERE userEmail=? AND rowId=?';
        //TODO: this option could be useful to check if the user who is trying to delete the reservation
        //is the same who reserved it in the first place
        db.run(sql, [null, userEmail, rowId], function (err) {
            if(err){
                reject(err);
            }
            if(this.changes !== 1){
                resolve({error: "No reservation deleted"});
            }else{
                resolve(null);
            }
        })
    })
};

