import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { useEffect, useState } from 'react';
import API from './API';
import {MessageContext, OccupancyContext} from './messageCtx';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container, Toast } from 'react-bootstrap/'
import { TopBar } from './components/TopBar'
import { MainLayout, StatusLayout, GridLayout, NotFoundLayout, LoginLayout, LoadingLayout, InputLayout } from './components/PageLayout'

function App() {
  const [available, setAvailable] = useState(0);
  const [occupied, setOccupied] = useState(0);
  const [requested, setRequested] = useState(0);
  const [total, setTotal] = useState(0);

  //this state contains the info about all plane: type, number of rows, number of seats
  const [planesInfo, setPlanesInfo] = useState([]);

  //this state is needed when some change in the plane database occurs
  const [dirty, setDirty] = useState(true);

  //this state is needed when some changes in the occupancy table occurs
  const [dirty2, setDirty2] = useState(true);

  //this state keeps track if the user is currently logged-in
  const [loggedIn, setLoggedIn] = useState(false);

  //this state contains the user's info
  const [user, setUser] = useState(null);

  //this state contains the list of plane's seats to display (it is initialized from a predefined array)
  const [planes, setPlanes] = useState([]);

  //this states is needed to indicate whether we are waiting to receive the data from the database
  const [loading, setLoading] = useState(false);

  //this state contains the error's message
  const [message, setMessage] = useState('');

  //this state contains, if exists, the reservation of plane type's seats of the logged-in user.
  const [reservation, setReservation] = useState([]);

  //this state contains the colors to be displayed on the grid, according to the plane selected
  const [seatColors, setSeatColors] = useState([]);

  //this state contains the number of requested seats
  const [numberSeats, setNumberSeats] = useState(0);

  //this state contains all the seats that cause the conflict, it is needed in order to highlight them after the conflict
  const [reservationConflict, setReservationConflict] = useState([]);

  //this state is true when a conflict occurs, and the target seats are highlighted, it turned off after 5 seconds
  const [highlighted, setHighlighted] = useState(false);

  //If an error occurs, the error message will be shown in a toast
  const handleErrors = (err) => {
    let msg = '';
    if(err.error){
      msg = err.error;
    }else if(String(err) === "string"){
      msg = String(err);
    }else{
      msg = "Unknown Error";
    }
    setMessage(msg);
  }

  useEffect(() => {
    const init = async () => {
      try{
        setLoading(true);
        const user = await API.getUserInfo(); //here there are the user's info {id: 1, email: 'francesco@polito.it'},
        // if already logged in, otherwise an error will be throw
        setUser(user);
        setLoggedIn(true);
        setLoading(false);
      }catch(err){
        setUser(null);
        setLoggedIn(false);
        setLoading(false);
      }
    }
    init();
  }, []); //this useEffect is called only the first time the component is mounted

  //this effect retrieves planes information
  useEffect(() => {
    const initPlanesInfo = async () => {
      try{
        setLoading(true);
        const info = await API.getPlanesInfo();
        setPlanesInfo(info);
        setLoading(false)
      }catch(err){
        handleErrors(err)
        setLoading(false);
      }
    }
    initPlanesInfo();
  }, [])

    /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try{
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    }catch(err){
      //error is handled and visualized in the login form, here we just throw it
      throw err;
    }
  }

  /**
   * This function handles the logout process
   */
  const handleLogout = async () => {
    try{
      await API.logOut();
      setLoggedIn(false);
      setUser(null);
      setDirty2(true);
    }catch(err){
      handleErrors(err);
    }
  }

  const addReservationByGrid = async(type, reservations) => {
    try{
    const result = await API.addReservationByGrid(type, reservations);
    if(result.message){
      setHighlighted(true);
      setReservationConflict(result.occupiedSeats)
      setMessage(result.message)
    }
    }catch(err){
      handleErrors(err);
    }finally{
      setDirty(true);
      setDirty2(true);
    }
  }

  const addReservationByNumber = async(type, number) => {
    try{
      const result = await API.addReservationByNumber(type, {number: parseInt(number)})
      setDirty(true)
    }catch(err){
      handleErrors(err)
    }finally{
      setDirty2(true)
      setNumberSeats(0)
    }
  }

  const deleteReservation = async(type) => {
    try{
      const result = await API.deleteReservation(type);
    }catch(err){
      handleErrors(err)
    }finally{
      setDirty(true);
      setDirty2(true)
    }
  }

  return (
   <BrowserRouter>
      <MessageContext.Provider value={{handleErrors}}>
        <OccupancyContext.Provider value={{occupied, setOccupied, available, setAvailable, requested, setRequested, total, setTotal}}>
          <Container fluid className='App'>

            <TopBar logout={handleLogout} user={user} loggedIn={loggedIn} setDirty2={setDirty2} />

            <Routes>
              <Route path='/' element={loading ? <LoadingLayout/> :
              <MainLayout planesInfo={planesInfo} dirty={dirty} setDirty={setDirty} setDirty2={setDirty2} />} />
              <Route path='plane/:type' element={<StatusLayout planes={planes} setPlanes={setPlanes} loggedIn={loggedIn}
                     addReservationByGrid={addReservationByGrid} reservation={reservation} setReservation={setReservation}
                     dirty2={dirty2} setDirty2={setDirty2} deleteReservation={deleteReservation} numberSeats={numberSeats}
                     setNumberSeats={setNumberSeats} addReservationByNumber={addReservationByNumber}
                     setDirty={setDirty} />} >
                  <Route index element={<GridLayout loggedIn ={loggedIn} planes={planes} setPlanes={setPlanes} dirty={dirty} setDirty={setDirty}
                          reservation={reservation} setReservation={setReservation} seatColors={seatColors} setSeatColors={setSeatColors}
                          dirty2={dirty2} setDirty2={setDirty2} highlighted={highlighted} setHighlighted={setHighlighted}
                          reservationConflict={reservationConflict} setReservationConflict={setReservationConflict}
                          planesInfo={planesInfo} />} />
                  <Route path='automatic' element={loggedIn ? 
                  <InputLayout addReservationByNumber={addReservationByNumber} 
                    numberSeats={numberSeats} setNumberSeats={setNumberSeats} /> 
                    : <Navigate replace to='/login'/>} />
                  <Route path='*' element={<NotFoundLayout/>} />
              </Route>
              <Route path='/login' element={!loggedIn ? <LoginLayout login={handleLogin}/> : <Navigate replace to='/'/>}/>
              <Route path='*' element={<NotFoundLayout/>} />
            </Routes>

            <Toast show={message !== ''} onClose={() => setMessage('')} delay={5000} autohide bg="danger">
              <Toast.Body>{message}</Toast.Body>
            </Toast>

          </Container>
        </OccupancyContext.Provider>
      </MessageContext.Provider>
   </BrowserRouter>
  )
}

export default App
