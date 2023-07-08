import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { useEffect, useState } from 'react';
import API from './API';
import {MessageContext, OccupancyContext, ReservationContext} from './messageCtx';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container, Toast } from 'react-bootstrap/'
import { TopBar } from './components/TopBar'
import { MainLayout, StatusLayout, GridLayout, NotFoundLayout, LoginLayout, LoadingLayout, InputLayout } from './components/PageLayout'

function App() {
  const [available, setAvailable] = useState(0);
  const [occupied, setOccupied] = useState(0);
  const [requested, setRequested] = useState(0);
  const [total, setTotal] = useState(0);

  //this state contains the info about all planes: type, number of rows, number of seats
  const [planesInfo, setPlanesInfo] = useState([]);

  //this state is needed when some change related to reservations on the database occurs
  const [dirty, setDirty] = useState(true);

  //this state is needed when some changes in the occupancy table occurs
  const [dirty2, setDirty2] = useState(true);

  //this state keeps track if the user is currently logged-in
  const [loggedIn, setLoggedIn] = useState(false);

  //this state contains the user's info (if logged-in)
  const [user, setUser] = useState(null);

  //this state contains the list of plane's seats to display according with the selected plane
  const [planes, setPlanes] = useState([]);

  //this states is needed to indicate whether we are waiting to receive the data from the database
  const [loading, setLoading] = useState(false);

  //this state contains the error's message
  const [message, setMessage] = useState('');

  //this state contains, if exists, the reservation of the current plane type's seats of the logged-in user.
  const [reservation, setReservation] = useState([]);

  //this state contains the colors to be displayed on the grid, according to the plane selected
  const [seatColors, setSeatColors] = useState([]);

  //this state contains the number of requested seats
  const [numberSeats, setNumberSeats] = useState(0);

  //this state contains all the seats that cause the conflict, it is needed in order to highlight them after the conflict
  const [reservationConflict, setReservationConflict] = useState([]);

  //this state is true when a conflict occurs, and the target seats are highlighted, it turned false after 5 seconds
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

  //here there are the user's info {id: 1, email: 'francesco@polito.it'}, if already logged in
  useEffect(() => {
    const init = async () => {
      try{
        setLoading(true);
        const user = await API.getUserInfo();
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
  }, []);

  //this useEffect retrieves planes information
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

  //this function performs a reservation after the user has clicked on the requested seats
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

  //this function performs a reservation after the user has inserted the desidered number seats
  const addReservationByNumber = async(type, number) => {
    try{
      await API.addReservationByNumber(type, {number: parseInt(number)})
      setDirty(true)
    }catch(err){
      handleErrors(err)
    }finally{
      setDirty2(true)
      setNumberSeats(0)
    }
  }

  //this function cancels a reservation if exists, returns an error otherwise
  //dirty and dirty2 are also called in case of error because if in the meantime another user books some seats
  //or cancel its reservation, the grid and the occupancy are updated
  const deleteReservation = async(type) => {
    try{
      await API.deleteReservation(type);
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
          <ReservationContext.Provider value={{
            planes, setPlanes, reservation, setReservation, numberSeats, setNumberSeats, addReservationByNumber,
            addReservationByGrid, deleteReservation, seatColors, setSeatColors, highlighted, setHighlighted, reservationConflict,
            setReservationConflict,
          }}>
            <Container fluid className='App'>

              <TopBar logout={handleLogout} user={user} loggedIn={loggedIn} setDirty2={setDirty2} />

              <Routes>
                <Route path='/' element={loading ? <LoadingLayout/> :
                <MainLayout planesInfo={planesInfo} setDirty={setDirty} setDirty2={setDirty2} />} />
                <Route path='plane/:type' element={
                  <StatusLayout loggedIn={loggedIn} dirty2={dirty2} setDirty2={setDirty2} setDirty={setDirty} />
                  }>
                  <Route index element={
                    <GridLayout loggedIn ={loggedIn} dirty={dirty} setDirty={setDirty} dirty2={dirty2} 
                      setDirty2={setDirty2} planesInfo={planesInfo} />
                    }/>
                  <Route path='automatic' element={
                    loggedIn ? <InputLayout/> 
                    : <Navigate replace to='/login'/>} />
                  <Route path='*' element={<NotFoundLayout/>} />
                </Route>
                <Route path='/login' element={!loggedIn ? <LoginLayout login={handleLogin}/> : <Navigate replace to='/'/>}/>
                <Route path='*' element={<NotFoundLayout/>} />
              </Routes>

              <Toast show={message !== ''} className='toast-style' onClose={() => setMessage('')} delay={5000} autohide bg="danger">
                <Toast.Body>{message}</Toast.Body>
              </Toast>

            </Container>
          </ReservationContext.Provider>
        </OccupancyContext.Provider>
      </MessageContext.Provider>
   </BrowserRouter>
  )
}

export default App
