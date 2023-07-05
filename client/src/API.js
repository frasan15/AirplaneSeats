const SERVER_URL = 'http://localhost:3001/api/';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
      httpResponsePromise
        .then((response) => {
          if (response.ok) {
  
           // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
           response.json()
              .then( json => resolve(json) )
              .catch( err => reject({ error: "Cannot parse server response" }))
  
          } else {
            // analyzing the cause of error
            response.json()
              .then(obj => 
                reject(obj)
                ) // error msg in the response body
              .catch(err => reject({ error: "Cannot parse server response" })) // something else
          }
        })
        .catch(err => 
          reject({ error: "Cannot communicate"  })
        ) // connection error
    });
  }

  /**
   * Getting from the server side and the returning the whole list of seats of the specified plane
   */
  const getSeatsByType = async(type) => {
    return getJson(fetch(SERVER_URL + 'plane/' + type, {credentials: 'include'}))
  }

  /**
   * Getting the availability of the specified plane type
   */
  const getAvailability = async(type) => {
    return getJson(fetch(SERVER_URL + 'plane/' + type + '/getAvailability', {credentials: 'include'}))
  }

  /**
   * Get the reservation of the specified user on the specified plane type
   */
  const getReservationsByType = async(type) => {
    return getJson(fetch(SERVER_URL + 'plane/' + type + '/getReservations', {credentials: 'include'}))
  }

  /**
   * This function adds a reservation on the specified plane type, passing the reservations' array
   */
  const addReservationByGrid = async(type, reservations) => {
    return getJson(fetch(SERVER_URL + 'plane/' + type + '/addReservationByGrid', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(reservations)
    }))
  }

  /**
   * This function adds a reservation on the specified plane type, passing the number of the requested seats
   */
  const addReservationByNumber = async(type, number) => {
    return getJson(fetch(SERVER_URL + 'plane/' + type + '/addReservationByNumber', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(number)
    }))
  }

  /**
   * This function deletes a reservation on the specified plane type referred to the logged-in user
   */
  const deleteReservation = async(type) => {
    return getJson(fetch(SERVER_URL + 'plane/' + type + '/deleteReservation', {
        method: 'PATCH',
        credentials: 'include'
    }))
  }

  /**
   * This function wants username and password inside a "credentials" object.
   * It executes the log-in.
   */
  const logIn = async(credentials) => {
    return getJson(fetch(SERVER_URL + 'sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // this parameter specifies that authentication cookie must be forwared
        body: JSON.stringify(credentials)
    }))
  }

  /**
 * This function is used to verify if the user is still logged-in.
 * It returns a JSON object with the user info.
 */
const getUserInfo = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
      // this parameter specifies that authentication cookie must be forwared
      credentials: 'include'
    })
    )
  };
  
  /**
   * This function destroy the current user's session and execute the log-out.
   */
  const logOut = async() => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
      method: 'DELETE',
      credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
    })
    )
  }
  
  const API = {logIn, getUserInfo, logOut, getSeatsByType, getAvailability, getReservationsByType, addReservationByGrid, addReservationByNumber, deleteReservation};
  export default API;