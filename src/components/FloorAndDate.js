import * as React from 'react';
import '../index.css';
import '../App.css';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { isBrowser } from "react-device-detect";
import { DATE_FORMAT, selectFloorAtom, selectSeatDateAtom, floorListAtom } from "./Const";
import { useAtomValue, useAtom } from 'jotai';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Grid from '@mui/material/Grid';
import { Button } from "@mui/material";
import { addDayStringDateToString } from "./FormatDate";


const MESSAGE = {
  FLOOR: "Floor"
}

const FloorAndDate = (props) => {
  const Today = new Date();
  const selectFloor = useAtomValue(selectFloorAtom);
  const [selectSeatDate, setSelectSeatDate] = useAtom(selectSeatDateAtom);
  const floorList = useAtomValue(floorListAtom);
  const widthHeight = 480;

  const onClickDateBackButton = () => {
    const newDate = addDayStringDateToString(selectSeatDate, -1);
    setSelectSeatDate(newDate);
    props.dateChange(newDate);
  }
  const onClickDateForwardButton = () => {
    const newDate = addDayStringDateToString(selectSeatDate, 1);
    setSelectSeatDate(newDate);
    props.dateChange(newDate);
  }
  
  return (
    <Grid container justifyContent="center" alignItems="center" sx={{ minWidth: widthHeight, maxWidth: widthHeight }}>
      <Grid item xs={5}>
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
      </Grid>
      {!isBrowser && <Grid item xs={7}></Grid>}
      <Grid item xs={1}>
        <Button className="" onClick={onClickDateBackButton}>
          <ArrowBackIosIcon color="action" />
        </Button>
      </Grid>
      <Grid item xs={3}>
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
      </Grid>
      <Grid item xs={1}>
        <Button className="" onClick={onClickDateForwardButton}>
          <ArrowForwardIosIcon color="action" />
        </Button>
      </Grid>
      <Grid item xs={2}></Grid>
      {!isBrowser && <Grid item xs={5}></Grid>}
    </Grid>
  );
}

export default FloorAndDate;