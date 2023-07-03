'use strict'

// Data Access Object (DAO) module for accessing plane data

const db = require('./db');

//this functions retrieves the whole list of seats of the selected plane type

exports.listSeats = (type) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE type=?';
        db.all(sql, [type], (err, rows) => {
            if (err) {
                reject(err);
            }
            if(rows.length === 0){
                resolve([{error: "plane type not found"}])
            }
        resolve(rows);
        })
    })
};

//this functions returns the reservation performed by the specified user on the specified plane
exports.listSeatsByUser = (userEmail, type) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE userEmail=? AND type=?';
        db.all(sql, [userEmail, type], (err, rows) => {
            if(err){
                reject(err);
            }
            if(rows.length === 0){
                resolve([{error: "No reservations found with the specified user's email on the specified plane type"}]);
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
        db.get(sql, [rowId], (err, row) => {
            if(err){
                reject(err);
            }
        if(row.userEmail === null){
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

//this function checks if the specified user already owns other reservations on the same plane type
//if so, it returns an error, otherwise it returns null
exports.hasAlreadyReservations = (userEmail, type) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM plane WHERE userEmail=? AND type=?'
        db.all(sql, [userEmail, type], (err, rows) => {
            if(err){
                reject(err);
            }
            if(rows.length > 0){
                resolve({error: `the specified user already owns reservations on the plane type: ${type}`});
            }
            resolve({});
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
        const sql = 'SELECT rowId FROM plane WHERE type=? AND userEmail IS NULL'
        db.all(sql, [type], (err, rows) => {
            if(err){
                reject(err);
            }

            if(rows.length >= number){
                let index = 0;
                const result = [];
                for (const row of rows){
                    if(index < number){
                        index++;
                        result.push(row.rowId)
                    }
                }
                resolve(result);
            }else{
                resolve([{error: "there are not enough seats to perform the requested reservation or plane type not found"}])
            }
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

//this function deletes a reservation of a specific user on a specific plane, thereby 
//cancelling the entire reservation; the userEmail param represents the user who is trying to
//delete his own reservation; that value must be turned into NULL.
//it returns an error in case the user had no reservations on that plane,
//returns an empty object otherwise
exports.deleteReservation = (userEmail, type) => {//ho tolto rowId e aggiunto type
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE plane SET userEmail=? WHERE userEmail=? AND type=?';
        //TODO: this option could be useful to check if the user who is trying to delete the reservation
        //is the same who reserved it in the first place
        db.run(sql, [null, userEmail, type], function (err) {
            if(err){
                reject(err);
            }
            if(this.changes === 0){
                resolve({error: "Plane type not found or reservations not found"});
            }else{
                resolve({});
            }
        })
    })
};

