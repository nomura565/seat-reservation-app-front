import * as React from 'react';
import '../index.css';
import '../App.css';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { isMobile } from "react-device-detect";
import { DATE_FORMAT, selectFloorAtom, selectSeatDateAtom, floorListAtom } from "./Const";
import { useAtomValue } from 'jotai';

const MESSAGE = {
  FLOOR: "Floor"
}

const FloorAndDate = (props) => {
  const Today = new Date();
  const selectFloor = useAtomValue(selectFloorAtom);
  const selectSeatDate = useAtomValue(selectSeatDateAtom);
  const floorList = useAtomValue(floorListAtom);
  return (
    <div className={isMobile ? "" : "date-container"}>
      <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
        <InputLabel id="demo-simple-select-autowidth-label">{MESSAGE.FLOOR}</InputLabel>
        <Select
          labelId="demo-simple-select-autowidth-label"
          id="demo-simple-select-autowidth"
          value={selectFloor}
          onChange={props.handleChange}
          autoWidth
          label={MESSAGE.FLOOR}
        >
          {floorList.map((floor) => {
            return (<MenuItem key={floor.key} value={floor.floor_id}>
              {floor.floor_name}
            </MenuItem>)
          })}
        </Select>
      </FormControl>
      <div className="date">
        <Datetime
          locale='ja'
          inputProps={
            {
              "className": "date-input2",
              "readOnly": "readOnly"
            }
          }
          dateFormat={DATE_FORMAT}
          timeFormat={false}
          value={selectSeatDate}
          initialValue={selectSeatDate}
          closeOnSelect={true}
          onChange={selectedDate => { props.dateChange(selectedDate || Today) }}
        />
      </div>
    </div>
  );
}

export default FloorAndDate;