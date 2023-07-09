import { React, useContext, useEffect } from 'react';
import { Row, Col, Button, Table, Spinner, Form, FormControl, FormGroup, FormLabel } from 'react-bootstrap';
import { Link, useParams, Outlet } from 'react-router-dom';
import {MessageContext, OccupancyContext, ReservationContext} from '../messageCtx';
import API from '../API';
import { LoginForm } from './Auth';
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
  const { setReservation } = useContext(ReservationContext);
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
            setReservation([]);
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
            <Buttons loggedIn={props.loggedIn} setDirty2={setDirty2} setDirty={props.setDirty}/> 
          </Row>
        </Col>
      </Row>
    )
}

function GridLayout(props){
  const { planes, setPlanes, setSeatColors } = useContext(ReservationContext)
  const dirty = props.dirty;
  const setDirty = props.setDirty;
  const {handleErrors} = useContext(MessageContext);
  const {setRequested} = useContext(OccupancyContext)
  const {type} = useParams();
  const loggedIn = props.loggedIn;

  //this useEffect updates the grid of seats based on the requested plane and set the number of requested seats to 0
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
  }, [dirty]
  )

  //Whenever 'dirty' state turns true, the current plane seats list is 
  //checked and a new array is created, where id represents the id of the seat whereas the color represents 
  //the seat's status: if the seat is occupied then the color is grey, otherwise if it's available the color is green.
  useEffect(() => {
    setSeatColors(planes.map(plane => ({
      id: plane.rowId,
      color: plane.userEmail !== null ? '#888888' : 'MediumSeaGreen'
    })))
  }, [dirty]);

  return(
    <>
      {dirty ? 
      
        <Button variant="primary" disabled>
        <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
        Loading... 
        </Button>
        : <Grid planes={planes} setPlanes={setPlanes} loggedIn={loggedIn} dirty={dirty} setDirty={setDirty}
            dirty2={props.dirty2} setDirty2={props.setDirty2} planesInfo={props.planesInfo} />
      }
    </> 
  )
}

function InputLayout(props) {
  const { numberSeats, setNumberSeats, addReservationByNumber } = useContext(ReservationContext);
  const {type} = useParams()

  const handleSubmit = (event) => {
    event.preventDefault();
    addReservationByNumber(type, numberSeats);
  }
  return(
    <Form className="block-example border border-primary rounded mb-0 form-padding" onSubmit={handleSubmit} >
      <FormGroup>
        <FormLabel className='input-box'>Enter the number of seats you would like</FormLabel>
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
