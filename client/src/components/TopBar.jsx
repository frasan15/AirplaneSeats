import { Navbar, Nav, Form } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { LogoutButton, LoginButton } from './Auth';

const TopBar = (props) => {

    return(
        <Navbar bg="primary" expand="sm" variant="dark" fixed="top" className="navbar-padding">
                <Link to="/" onClick={() => props.setDirty2(true)}>
                    <Navbar.Brand>
                    <i className="bi bi-arrow-left display-6"></i>
                    </Navbar.Brand>
                </Link>
                <Navbar.Collapse className="justify-content-center">
                <Link to="/">
                    <Navbar.Brand style={{fontSize: '25px', fontWeight: 'bold'}}>
                        AirPlane Seats
                    </Navbar.Brand>
                </Link>
                </Navbar.Collapse>
                <Nav className="ml-md-auto">
                    <Form className="mx-2">
                        {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                    </Form>
                </Nav>
        </Navbar>
        
    )
}

export {TopBar}