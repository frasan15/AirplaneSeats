import { Navbar, Nav, Form } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { LogoutButton, LoginButton } from './Auth';

const TopBar = (props) => {
    const handleSubmit = (event) => {
        event.preventDefault();
    }

    return(
        <Navbar bg="primary" expand="sm" variant="dark" fixed="top" className="navbar-padding">
                <Link to="/" onClick={() => props.setDirty2(true)}>
                    <Navbar.Brand>
                    <i className="bi bi-arrow-left"></i>
                    </Navbar.Brand>
                </Link>
                <Navbar.Collapse className="justify-content-center">
                <Link to="/">
                    <Navbar.Brand>
                        AirPlane Seats
                    </Navbar.Brand>
                </Link>
                </Navbar.Collapse>
                <Nav className="ml-md-auto">
                    <Navbar.Text className="mx-2">
                        {props.user && props.user.name && `Welcome, ${props.user.name}!`}
                    </Navbar.Text>
                    <Form className="mx-2">
                        {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                    </Form>
                </Nav>
        </Navbar>
        
    )
}

export {TopBar}