import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { useEffect, useState } from 'react';
import API from './API';
import MessageContext from './messageCtx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Toast } from 'react-bootstrap/'
import { TopBar } from './components/TopBar'
import { MainLayout, NotFoundLayout, LoginLayout, LoadingLayout } from './components/PageLayout'

function App() {
  //this state is needed when some change in the plane database occurs
  const [dirty, setDirty] = useState(true);

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

  const planesInfo = {
    'local': {rows: 15, seats: 4},
    'regional': {rows: 20, seats: 5},
    'international': {rows: 25, seats: 6}
  };

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
        console.log(user)
        setUser(user);
        setLoggedIn(true);
        setLoading(false);
      }catch(err){
        handleErrors(err); //mostly unauthenticated user, thus set not logged in
        setUser(null);
        setLoggedIn(false);
        setLoading(false);
      }
    }
    init();
  }, []); //this useEffect is called only the first time the component is mounted

    /**
   * This function handles the login process.
   * It requires a username and a password inside a "credentials" object.
   */
  const handleLogin = async (credentials) => {
    try{
      const user = await API.logIn(credentials);
      console.log(user)
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
    await API.logOut();
    setLoggedIn(false);
    setUser(null);
    setPlanes([]);
  }

  return (
   <BrowserRouter>
      <MessageContext.Provider value={{handleErrors}}>
        <Container fluid className='App'>

          <TopBar logout={handleLogout} user={user} loggedIn={loggedIn}/>

          <Routes>
            <Route path='/' element={<MainLayout planesInfo={planesInfo} />} />
            {/*<Route path='plane/:type' element={loggedIn ? <StatusLayout planes={planes} setPlanes={setPlanes} loggedIn={loggedIn} setLoggedIn={setLoggedIn} /> : <Navigate replace to='/login'/>} >
                <Route path='manual' element={loggedIn ? <GridLayout planes={planes} setPlanes={setPlanes}/> : <Navigate replace to='/login'/>} />
                <Route path='automatic' element={loggedIn ? <InputLayout/> : <Navigate replace to='/login'/>} />
                <Route path='*' element={<NotFoundLayout/>} />
              </Route>*/}
            <Route path='/login' element={!loggedIn ? <LoginLayout login={handleLogin}/> : <Navigate replace to='/'/>}/>
            {/*
            <Route path='/' element={loggedIn ? <h1>main page</h1>: <Navigate replace to='/login'/>}/>
            <Route path='login' element={!loggedIn ? <LoginLayout login={handleLogin}/> : <Navigate replace to='/'/>}/>
            */}
          </Routes>

          <Toast show={message !== ''} onClose={() => setMessage('')} delay={4000} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>

        </Container>
      </MessageContext.Provider>
   </BrowserRouter>
  )
}

export default App
