import { React, useContext, useState, useEffect } from 'react';
import { Row, Col, Button, Table, Spinner, Form, FormControl, FormGroup, FormLabel } from 'react-bootstrap';
import { Link, useParams, useLocation, Outlet } from 'react-router-dom';
import {MessageContext, OccupancyContext} from '../messageCtx';
import API from '../API';
import { LoginForm } from './Auth';
import Stack from 'react-bootstrap/Stack';
import {Grid} from './Grid'
import { Buttons } from './Buttons';

function MainLayout(props) {
  const planesInfo = props.planesInfo;
  let index = 4;
  let path = ``
  return(
    <>
      <Row className='below-nav justify-content-center align-items-center'> 
        <Col className='text-center'>
          <h1 className='custom-heading'> Select a plane </h1>
        </Col> 
      </Row>
        <Row className='w-100 d-flex justify-content-between' >
          {planesInfo.map((plane) => {
            index--;
            let displayClass = `display-${index}`
          {path = `plane/${plane.type}`}
          return(
            <Col key={plane.type} lg={4} className="below-nav">
              <Link to={path} onClick={() => {
                props.setDirty(true);
                props.setDirty2(true)
                }}> 
              {/* everytime I select a new plane, a new API call must be performed, to get the desidered plane seats */}
                <div className="text-center square-wrapper airplane-fixed-size">
                  <h4>{plane.type}</h4>
                  <div className={displayClass}>
                  <i className="bi bi-airplane-engines-fill"></i>
                  </div>
                </div>
              </Link>
            </Col>
          )
          })}
        </Row>

</>
  )
}

function StatusLayout(props) {
  const {type} = useParams();
  const { occupied, setOccupied, available, setAvailable, requested, setRequested, total, setTotal } = useContext(OccupancyContext);
  const {handleErrors} = useContext(MessageContext);
  const dirty2 = props.dirty2
  const setDirty2 = props.setDirty2
  
  //whenever a user changes plane its availability must be updated; setting also the requested number seats to 0 
  //for cleaning, and reservation state to an empty array: this is needed because if the user is clicking on some
  //seats and at a certain point he performs log-out, the reservation array must be resetted; this is why the dirty2
  //state becomes true after the log-out (see handleLogout in App.jsx) 
  useEffect(() => 
    {
      if(dirty2){    
        API.getAvailability(type)
          .then(result => {
            setAvailable(result.available);
            setOccupied(result.occupied);
            setTotal(result.total);
            setRequested(0);
            props.setReservation([]);
          })
          .catch(err => {
            handleErrors(err);
          }); 
          setDirty2(false)
      }
    }, [dirty2]
  )

    return (
      dirty2 ? 
      <Button variant="primary" disabled>
      <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
        Loading... 
      </Button> :
      <Row className="vh-100">
        <Col xl={3} bg='light' className='below-nav'>
          <Table striped bordered>
            <tbody>
              <tr>
                <td className='custom-table-entry'>Occupied seats</td>
                <td>{occupied}</td>
              </tr>
              <tr>
                <td className='custom-table-entry'>Available seats</td>
                <td>{available}</td>
              </tr>
              {props.loggedIn && (
                <tr>
                  <td className='custom-table-entry'>Requested seats</td>
                  <td>{requested}</td>
                </tr>
              )}
              <tr>
                <td className='custom-table-entry'>Total seats</td>
                <td>{total}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col xl={6} className='below-nav'>
          <Outlet/>
        </Col>
        <Col xl={3} className='below-nav' >
        <Row>
            <Buttons loggedIn={props.loggedIn} addReservationByGrid={props.addReservationByGrid}
              reservation={props.reservation} setReservation={props.setReservation} setDirty2={setDirty2}
              deleteReservation={props.deleteReservation} numberSeats={props.numberSeats} setDirty={props.setDirty}
              setNumberSeats={props.setNumberSeats} addReservationByNumber={props.addReservationByNumber} /> 
          </Row>
        </Col>
      </Row>
    )
}

function GridLayout(props){
  const dirty = props.dirty;
  const setDirty = props.setDirty;
  const planes = props.planes;
  const setPlanes = props.setPlanes;
  const {handleErrors} = useContext(MessageContext);
  const {setRequested} = useContext(OccupancyContext)
  const {type} = useParams();
  const loggedIn = props.loggedIn;

  //setDirty(true)
  useEffect(() => {
    
  API.getSeatsByType(type)
    .then(seats => {
      setPlanes(seats);
      setRequested(0);
      setDirty(false);
    }).catch(err => {
      handleErrors(err)
      setDirty(false)
    })
/*
  API.getReservationsByType(type)
    .then(result => {
      setReservation(result);
    }).catch(err => {
      //handleErrors(err)
    })*/
  }, [dirty]
  )

  return(
    <>
      {dirty ? 
      
        <Button variant="primary" disabled>
        <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
        Loading... 
        </Button>
        : <Grid planes={planes} setPlanes={setPlanes} loggedIn={loggedIn} dirty={dirty} setDirty={setDirty}
            reservation={props.reservation} setReservation={props.setReservation} seatColors={props.seatColors}
            setSeatColors={props.setSeatColors} dirty2={props.dirty2} setDirty2={props.setDirty2}
            highlighted={props.highlighted} setHighlighted={props.setHighlighted} reservationConflict={props.reservationConflict}
            setReservationConflict={props.setReservationConflict}
            planesInfo={props.planesInfo} />
        
      }
    </> 
  )
}

function InputLayout(props) {
  const numberSeats = props.numberSeats;
  const setNumberSeats = props.setNumberSeats
  const {type} = useParams()

  const handleSubmit = (event) => {
    event.preventDefault();
    props.addReservationByNumber(type, numberSeats);
  }
  return(
    <Form className="block-example border border-primary rounded mb-0 form-padding" onSubmit={handleSubmit} >
      <FormGroup>
        <FormLabel>Insert the desired seat numbers</FormLabel>
        <FormControl value={numberSeats>0 ? numberSeats : ""} type="number" required={true} onChange={event => setNumberSeats(event.target.value)} />
      </FormGroup>
    </Form>
  )
}

function NotFoundLayout() {
    return(
        <>
          <h2 className="below-nav">This is not the route you are looking for!</h2>
          <Link to="/">
            <Button variant="primary">Go Home!</Button>
          </Link>
        </>
    );
  }

/**
 * This layout shuld be rendered while we are waiting a response from the server.
 */
function LoadingLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={4} bg="light" className="below-nav" id="left-sidebar">
      </Col>
      <Col md={8} className="below-nav">
        <h1>Airplane seats are loading ...</h1>
      </Col>
    </Row>
  )
}

function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={12} className="below-nav">
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

export {MainLayout, StatusLayout, GridLayout, InputLayout, NotFoundLayout, LoadingLayout, LoginLayout}


    /*
    <>
      <Row className='below-nav'> <h1 className='justify-content-center'> Select your plane </h1> </Row>
        <Row className='w-100 d-flex justify-content-between'>
          <Col lg={4} className="below-nav">
            <Link to={path}>
              <div className="text-center square-wrapper">
                <h4>Local</h4>
                <i className="bi bi-airplane-engines-fill"></i>
              </div>
              </Link>
          </Col>
          <Col lg={4} className="below-nav">
            <Link to=''>
              <div className="text-center square-wrapper">
                <h4>Regional</h4>
                <i className="bi bi-airplane-engines-fill"></i>
              </div>
            </Link>
          </Col>
          <Col lg={4} className="below-nav">
            <div className="text-center square-wrapper">
              <h4>International</h4>
              <i className="bi bi-airplane-engines-fill"></i>
            </div>
          </Col>
        </Row>
    </>
    */




    /*<Grid planes={planes} setPlanes={setPlanes} loggedIn={loggedIn}/>*/