import { React, useContext, useState, useEffect } from 'react';
import { Row, Col, Button, Spinner } from 'react-bootstrap';
import { Link, useParams, useLocation, Outlet } from 'react-router-dom';
import MessageContext from '../messageCtx';
import API from '../API';
import { LoginForm } from './Auth';
import Stack from 'react-bootstrap/Stack';
import { Container } from 'react-bootstrap/'

function MainLayout(props) {
  const planesInfo1 = props.planesInfo;
  const planesInfo = Object.entries(planesInfo1);
  let path = `plane/${"local"}`
  return(
    <>
      <Row className='below-nav'> <h1 className='justify-content-center'> Select your plane </h1> </Row>
        <Row className='w-100 d-flex justify-content-between'>
          {planesInfo.map(([planeType, {}]) => {
          {path = `plane/${planeType}`}
          return(
            <Col lg={4} className="below-nav">
              <Link to={path}>
                <div className="text-center square-wrapper">
                  <h4>{planeType}</h4>
                  <i className="bi bi-airplane-engines-fill"></i>
                </div>
              </Link>
            </Col>
          )
          })}
        </Row>

</>
  )
}

function NotFoundLayout() {
    return(
        <>
          <h2>This is not the route you are looking for!</h2>
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

export {MainLayout, NotFoundLayout, LoadingLayout, LoginLayout}


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