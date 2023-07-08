import 'bootstrap/dist/css/bootstrap.min.css';
import { useContext, useEffect, useState } from "react";
import { Button, Row } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ReservationContext } from '../messageCtx';

function Buttons(props) {
    const { addReservationByGrid, reservation, setReservation, addReservationByNumber, numberSeats, 
            setNumberSeats, deleteReservation } = useContext(ReservationContext)
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
          <Link className='mb-3 custom-button text-center square-wrapper' 
          to={selectionType === 'manual' ? urlAutomatic : urlManual}
          onClick={() => {
            props.setDirty2(true);
            props.setDirty(true)
            }}>
            {selectionType === 'manual' ? "Random assignment of seats": "Select seats from the grid"}
          </Link>
        </Row>
        <Row>
        <Button className="mb-3 custom-button" variant="success" onClick={selectionType === 'manual' ? () => {
                  addReservationByGrid(type, reservation);
                  setReservation([]);}
                  : () => addReservationByNumber(type, numberSeats)}
                  disabled={selectionType === 'manual' ? reservation.length === 0 : numberSeats === 0}>
                    Save
        </Button>
        <Button className="mb-3 custom-button" variant="warning" onClick={selectionType === 'manual' ? () => {
                  props.setDirty2(true)}
                  : () => setNumberSeats(0)}
                  disabled={selectionType === 'manual' ? reservation.length === 0 : numberSeats === 0}>
                    Cancel
        </Button>
        </Row>
        <Row>
          <Button className="mb-3 custom-button" variant="outline-danger" onClick={() => deleteReservation(type)}>
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