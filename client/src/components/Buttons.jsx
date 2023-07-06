import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from "react";
import { Button, Row } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";

function Buttons(props) {
    const {type} = useParams();
    const location = useLocation();
    const currentURL = location.pathname;
    const [selectionType, setSelectionType] = useState('');
    const loggedIn = props.loggedIn;
    const urlAutomatic = `/plane/${type}/automatic`
    const urlManual = `/plane/${type}`

    useEffect(() => {
        if(currentURL.includes('automatic')){
            setSelectionType('automatic');
        }else{
            setSelectionType('manual')
        }
    }, [currentURL])

    return(
      loggedIn ? 
      <>
        <Row>
          <Link className='mb-3 custom-button text-center square-wrapper' to={selectionType === 'manual' ? urlAutomatic : urlManual}
          onClick={() => {
            props.setDirty2(true);
            props.setDirty(true)
            }}>
            {selectionType === 'manual' ? "Go to input box": "Go to grid selection"}
          </Link>
        </Row>
        <Row>
        <Button className="mb-3 custom-button" variant="success" onClick={selectionType === 'manual' ? () => {
                  props.addReservationByGrid(type, props.reservation);
                  props.setReservation([]);}
                  : () => props.addReservationByNumber(type, props.numberSeats)}
                  disabled={selectionType === 'manual' ? props.reservation.length === 0 : props.numberSeats === 0}>
                    Save
        </Button>
        <Button className="mb-3 custom-button" variant="warning" onClick={selectionType === 'manual' ? () => {
                  props.setDirty2(true)
                  props.setReservation([])}
                  : () => props.setNumberSeats(0)}
                  disabled={selectionType === 'manual' ? props.reservation.length === 0 : props.numberSeats === 0}>
                    Cancel
        </Button>
        </Row>
        <Row>
          <Button className="mb-3 custom-button" variant="outline-danger" onClick={() => props.deleteReservation(type)}>
            Cancel previous reservation
          </Button>
        </Row>
      </>
      :
      <Link className="btn btn-info mb-3 custom-button" to='/login'>
        Go to input form to perform reservations
      </Link>
    )
}

export {Buttons}