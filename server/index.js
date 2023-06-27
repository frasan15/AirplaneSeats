/*'use strict';

const express = require('express');

// init express
const app = new express();
const port = 3001;
*/

//importing modules
const express = require('express');
const morgan = require('morgan');// logging middleware
const cors = require('cors');

const { check, validationResult, } = require('express-validator'); // validation middleware

const planeDao = require('./dao-plane');//module for accessing the plane table in the db
const userDao = require('./dao-user');//module for accessing the user table in the db

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());

//perhaps the following instructions are useful to check the 'loading icon'
/**
 * The "delay" middleware introduces some delay in server responses. To change the delay change the value of "delayTime" (specified in milliseconds).
 * This middleware could be useful for debug purposes, to enabling it uncomment the following lines.
 */ 
/*
const delay = require('express-delay');
app.use(delay(200,2000));
*/

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, email).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username or password');  
    
  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, email)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + email
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));

  return callback(null, user); // this will be available in req.user
});

/** Creating the session */
const session = require('express-session');

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}


/*** Utility Functions ***/

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** User APIs ***/
// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json({ error: info});
      }
      // success, perform the login and extablish a login session
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser() in LocalStratecy Verify Fn
        return res.json(req.user);
      });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

/*** Plane APIs ***/
// 1. Retrieve the list of all the seats belonging to the specified plane type
// GET /api/plane/:type
// Given a plane type, this route returns the associated set of seats. 
app.get('/api/plane/:type', isLoggedIn, [check('type').isString()], async (req, res) => {
  try{
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
  
    const result = await planeDao.listSeats(req.params.type);
    return res.status(200).json(result);
  }catch (err){
    return res.status(500).end();
  }
})

// 2. Get all the reservations made by a specific user, by providing all the relevant information
// GET /api/plane/:type/getReservations
// Given a plane type and a user's email, this route returns all the reservations performed by the specified
// user, where a reservation is represented by a row in the plane table
app.get('/api/plane/:type/getReservations/:userEmail', isLoggedIn, 
[check('type').isString(), check('userEmail').isString()],
async(req, res) => {
  try{
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const result = await planeDao.listSeatsByUser(userEmail);
    const isSameType = (firstType) => (obj) => obj.type === firstType;

    const sameType = result.every(isSameType(firstType));
    if(!sameType){
      res.status(400).json({error: "each user can make reservation for one plane only"});
    }

    return res.status(200).json(result);
  }catch (err){
    return res.status(500).end();
  }
})

// 3. Create a reservation, by providing all the relevant information, through an array of reservations
// PUT /api/plane/:type/addReservationByGrid
// Given a plane type and the list of the reservations to be performed, this route updates each requested seat,
// by setting the userEmail value with the one of the user who is trying to perform the reservation.
// An object containing the reservation array and the user's email who is trying to perform the reservation
// is passed through the request body
app.put('/api/plane/:type/addReservationByGrid', isLoggedIn, [check('type').isString()], async(req, res) => {
  try{
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    type = req.params.type;
    
    //reservations are in the following format: {reservations: [{row: 15, seat: A}, {row: 15, seat: B}],
    //userEmail: "Io@email.it"}
    const list = req.body.reservations;
    const userEmail = list.userEmail;
    const reservations = list.reservations;
    const temp = {};
    const result = [];
    const isOccupied = true;
    const occupiedSeats = [];

    //if the user already owns reservations on other planes, then an error is returned
    const otherReservations = await planeDao.hasAlreadyReservations(userEmail, type);
    if(otherReservations.error){
      return res.status(422).json({error: check.error});
    }

    //if any of the requested seats is already occupied, then an error will be returned
    reservations.forEach(async(reservation) => {
      rowId = await planeDao.getSeatByTriplet(reservation.row, reservation.seat, type);
      isOccupied = await planeDao.isOccupied(rowId);
      if(isOccupied){
        occupiedSeats.push({row: reservation.row, seat: reservation.seat});
      }
    });

    if(occupiedSeats.length > 0){
      //the following array will contain all the seats which caused the failure
      return res.status(409).json(occupiedSeats);
    }

    reservations.forEach(async (reservation) => {
      rowId = await planeDao.getSeatByTriplet(reservation.row, reservation.seat, type);
      temp = await planeDao.addReservation(userEmail, rowId);
      if(temp.error){
        return res.status(404).json({error: temp.error})
      }else{
        result.push(temp);
      }
    });

    return res.status(200).json(result);

  }catch(err){
    return res.status(500).end();
  }
});

// 4. Create a reservation, by providing all the relevant information, through the number of the needed seats
// PUT /api/plane/:type/addReservationByNumber
// Given a plane type and the number of the requested seats, this route updates each requested seat,
// by setting the userEmail value with the one of the user who is trying to perform the reservation.
// An object containing the user's email who is trying to perform the reservation
// and the number of the requested seats is passed through the request body: 
// {userEmail: "francesco@polito.it", number: 5}
app.put('/api/plane/:type/addReservationByNumber/', isLoggedIn, [check('type').isString()], async(req, res) => {
  try{
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    type = req.params.type;
    const {userEmail, number} = req.body;

    //if the user already owns reservations on other planes, then an error is returned
    const otherReservations = await planeDao.hasAlreadyReservations(userEmail, type);
    if(otherReservations.error){
      return res.status(422).json({error: check.error});
    }

    //the following is an array containing the rowId of the first free seats to be booked, each provided
    //by its own rowId
    const seats = await planeDao.getFirstFreeSeats(type, number);

    seats.forEach(async (rowId) => {
      temp = await planeDao.addReservation(userEmail, rowId);
      if(temp.error){
        return res.status(404).json({error: temp.error})
      }else{
        result.push(temp);
      }
    });

    return res.status(200).json(result);


  }catch(err){
    return res.status(500).end();
  }
})

// 5. Delete a reservation, by providing all the relevant information
// PUT /api/plane/:type/deleteReservation
// Given a plane type and the list of the reservations to be deleted, this route updates each requested seat,
// by setting the userEmail to null.
// An object containing the reservation array to be deleted and the user's email who is trying to 
// perform the cancellation of reservations is passed through the request body
app.put('/api/plane/:type/deleteReservation', isLoggedIn, [check('type').isString()], async(req, res) => {
  try{
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }
    type = req.params.type;
    
    //reservations are in the following format: {reservations: [{row: 15, seat: A}, {row: 15, seat: B}],
    //userEmail: "Io@email.it"}
    const list = req.body.reservations;
    const userEmail = list.userEmail;
    const reservations = list.reservations;
    const temp = {};
    const result = [];
    const isAuthorized = true;

    //if any of the requested seats to get free does not belong to the specified user, then an error will be returned
    reservations.forEach(async(reservation) => {
      rowId = await planeDao.getSeatByTriplet(reservation.row, reservation.seat, type);
      isAuthorized = await planeDao.isAuthorized(rowId, userEmail);
      if(isAuthorized){
        return res.status(401).json({error: "the requested seat is not booked by the current user"});
      }
    });

    reservations.forEach(async (reservation) => {
      rowId = await planeDao.getSeatByTriplet(reservation.row, reservation.seat, type);
      temp = await planeDao.deleteReservation(userEmail, rowId);
      if(temp.error){
        return res.status(404).json({error: temp.error})
      }else{
        result.push(temp);
      }
    });

    return res.status(200).json(result);

  }catch(err){
    return res.status(500).end();
  }
})


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});