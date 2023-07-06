import React, { useEffect, useContext, useState } from 'react';
import { Table, Button, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { OccupancyContext } from '../messageCtx';

function Grid (props) {
  const reservation = props.reservation
  const setReservation = props.setReservation
  const planes = props.planes;
  const {type} = useParams();
  const loggedIn = props.loggedIn
  const dirty = props.dirty;
  const setDirty = props.setDirty;

  //this state is true whenever a seat is clicked, it turned false when the grid view has been updated with the
  //requested or no-longer-requested seats.
  const [dirty1, setDirty1] = useState(true)

  //this state contains, if a seat has been clicked, the related seat information
  const [clickedSeat, setClickedSeat] = useState({});

  const seatColors = props.seatColors;
  const setSeatColors = props.setSeatColors
  const { setAvailable, requested, setRequested } = useContext(OccupancyContext);
  const dirty2 = props.dirty2
  const setDirty2 = props.setDirty2

  //Whenever this component is mounted or the 'dirty' state turns true, the current plane seats list is 
  //checked and a new array is created, where id represents the id of the seat whereas the color represents 
  //the seat's status: if the seat is occupied then the color is grey, otherwise if it's available the color is green.
  //At the end the dirty1 status is setted to false -> this part is likely useless
  useEffect(() => {
    setSeatColors(planes.map(plane => ({
      id: plane.rowId,
      color: plane.userEmail !== null ? '#888888' : 'MediumSeaGreen'
    })))
  //setDirty1(false)
  }, [dirty]);
/*
  useEffect(() => {
    if((!loggedIn && requested > 0 ) || dirty2){
      const updatedSeatColors = seatColors.map(s => {
        if(s.color === '#ff9900'){
          return {...s, color: 'MediumSeaGreen'};
        }else{
          return s;
        }
      });
      setAvailable(oldAvailable => oldAvailable + requested)
      setRequested(0);
      setSeatColors(updatedSeatColors)
      setReservation([]);
    }
  }, [loggedIn, dirty2])
*/

  //whenever the user selects a seat there are three possible scenarios:
  //1. If the seat is occupied nothing happens and the dirty1 state turns false
  //2. If the seat is available then its color becomes orange, the 'requested' and 'available' states are updated
  //accordingly and this new reservation is added to 'reservation' state
  //3. If the seat is requested then its color becomes green, the 'requested' and 'available' states are updated 
  //accordingly and the reservation associated to this seat is removed from 'reservation' state
  useEffect(() => {
    if(loggedIn && dirty1){
      if(clickedSeat.userEmail === null){
        let seat = seatColors.find(s => s.id === clickedSeat.rowId)
        if(seat.color === 'MediumSeaGreen'){
          seat['color'] = '#ff9900';
          setRequested(oldRequested => oldRequested + 1)
          setAvailable(oldAvailable => oldAvailable - 1)
          const newReservation = {
            row: clickedSeat.row,
            seat: clickedSeat.seat
          }
          setReservation([...reservation, newReservation]);
        }else if(seat.color === '#ff9900'){
          seat['color'] = 'MediumSeaGreen';
          setRequested(oldRequested => oldRequested - 1)
          setAvailable(oldAvailable => oldAvailable + 1)
          setReservation((prevReservation) =>
          prevReservation.filter((reservation) => reservation.row !== clickedSeat.row || reservation.seat !== clickedSeat.seat)
        );
        }
      }
    }
    setDirty1(false)
  }, [dirty1])

  //whenever the user tries to send his reservation but some or all the seats he selected become occupied in the 
  //meantime, then the seats causing the conflict are highlighted in red for 5 seconds, after that they become grey,
  //i.e. occupied. Furthermore the 'reservationConflict' turns on an empty array and the 'dirty' state turns true
  //to update the grid and show all the new occupied seats
  useEffect(() => {
    if(props.reservationConflict.length > 0 && props.highlighted){
      const highlightedSeats = seatColors.map((seat) => {
        if(props.reservationConflict.some((conflict) => conflict.rowId === seat.id)){
          return {...seat, color: 'red'}
        }
        return seat;
      })
      setSeatColors(highlightedSeats);

      setDirty(true)
      const timeout = setTimeout(() => {
        const restoreSeats = highlightedSeats.map((seat) => {
          if(seat.color === 'red'){
            return {...seat, color: '#888888'}
          }else if(seat.color === '#ff9900'){
            return {...seat, color: 'MediumSeaGreen'}
          }
          else{
            return seat;
          }
        });

        setSeatColors(restoreSeats);
        props.setHighlighted(false);
        props.setReservationConflict([]);
        setDirty(true)
      }, 5000);

      return () => {
        clearTimeout(timeout);
      }
    }

  }, [props.highlighted])
  
  return (
    <>
      {(dirty || dirty1) ? 
      <Button variant="primary" disabled>
        <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
        Loading...
      </Button> :
      <div>
        <MyTable type={type} planes={planes} seatColors={seatColors} clickedSeat={clickedSeat}
          setClickedSeat={setClickedSeat} setDirty1={setDirty1}
          planesInfo={props.planesInfo} />
      </div>
      }
    </>
  );
};

function MyTable(props) {
  const type = props.type
  const planes = props.planes
  const seatColors = props.seatColors
  const clickedSeat = props.clickedSeat
  const setClickedSeat = props.setClickedSeat
  const setDirty1 = props.setDirty1

  const planesInfo = props.planesInfo.find(p => p.type === type)
  const numRows = planesInfo.rowNumber;
  const numCols = planesInfo.seatNumber;

  const rows = [];
  for (let row = 1; row <= numRows; row++) {
    const cells = [];
    for (let col = 0; col < numCols; col++) {
      const seat = String.fromCharCode(65 + col);
      const seatId = `${row}${seat}`;
      const seatData = planes.find((s) => s.row === row && s.seat === seat);
      let s = seatColors.find(s => s.id === seatData.rowId)

      const handleClick = () => {
        setClickedSeat(seatData);
        setDirty1(true)
      };

      cells.push(
        <td key={seatId} className="td-seat" style={{ backgroundColor: s.color, cursor: 'pointer' }}
          onClick={handleClick}>
          {seatId}
        </td>
      );
    }
    rows.push(<tr key={row} className='td-seat-container'>{cells}</tr>);
  }

  return (
    <Table striped>
      <tbody>{rows}</tbody>
    </Table>
  );
}

export {Grid};