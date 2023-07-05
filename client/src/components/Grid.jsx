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
  const [dirty1, setDirty1] = useState(true)
  const [clickedSeat, setClickedSeat] = useState({});
  const seatColors = props.seatColors;
  const setSeatColors = props.setSeatColors
  const { setAvailable, requested, setRequested } = useContext(OccupancyContext);
  const dirty2 = props.dirty2
  const setDirty2 = props.setDirty2

  useEffect(() => {
  setSeatColors(planes.map(plane => ({
    id: plane.rowId,
    color: plane.userEmail !== null ? '#888888' : 'MediumSeaGreen'
  })))
  setDirty1(false)
  }, []);

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

  const getTypeConfig = (type) => {
    switch (type) {
      case 'local':
        return { numRows: 15, numCols: 4 };
      case 'regional':
        return { numRows: 20, numCols: 5 };
      case 'international':
        return { numRows: 25, numCols: 6 };
      default:
        return { numRows: 0, numCols: 0 };
    }
  };

  return (
    <>
      {(dirty || dirty1) ? 
      <Button variant="primary" disabled>
        <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
        Loading...
      </Button> :
      <div>
        <MyTable type={type} planes={planes} seatColors={seatColors} clickedSeat={clickedSeat}
          setClickedSeat={setClickedSeat} getTypeConfig={getTypeConfig} setDirty1={setDirty1} />
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
  const getTypeConfig = props.getTypeConfig
  const setDirty1 = props.setDirty1

  const { numRows, numCols } = getTypeConfig(type);

  if (numRows === 0 || numCols === 0) {
    return null;
  }

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