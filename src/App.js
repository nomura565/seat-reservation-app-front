import Leaflet from 'leaflet';
import React, { useState,useRef,useEffect } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import LeafletMain from './components/Leaflet';
//import DatePicker, { registerLocale } from "react-datepicker";
//import "react-datepicker/dist/react-datepicker.css";
import {API_URL,formatDate} from "./components/Const";

import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import axios from "axios";

Leaflet.Icon.Default.imagePath =
  '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/'

  const App = () => {
    const childRef = useRef();
    const Today = new Date();
    const [seatDate, setSeatDate] = useState(Today);
    const [floor, setFloor] = React.useState("1");
    let tmpFloorList = [];
  
    const [floorList, setFloorList] = useState(tmpFloorList);
    //registerLocale('ja', ja);

    useEffect(() =>{
      getFloorList();
    },[])

    const getFloorList = () => {
      axios
        .get(API_URL.FLOOR)
        .then((response) => {
          //console.log(response.data);
          setFloorList(response.data);
        });
    }

    const handleChange = (e) => {
      setFloor(e.target.value);

      let temp = floorList.find(floor => floor["floor_id"] === e.target.value);
      //console.log(temp);
      childRef.current.setFloorMapFromParent(temp["floor_map"]);
      childRef.current.changeSeatList(seatDate, e.target.value);
    };

    const dateChange = (selectedDate) => {
      try {
        let date = formatDate(selectedDate);
        //console.log(date);
        setSeatDate(date);
        childRef.current.changeSeatList(selectedDate, floor);
      }catch{
        console.log("不正な日付");
      }
    }

    const getSeatDate = () => {
      return seatDate;
    }

    const getFloor = () => {
      return floor;
    }

    return (
      <div>
        <div className='date-container'>
          <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
            <InputLabel id="demo-simple-select-autowidth-label">Floor</InputLabel>
            <Select
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={floor}
              onChange={handleChange}
              autoWidth
              label="Floor"
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
                {"className":"date-input2"}
              }
              dateFormat="yyyy/MM/DD"
              timeFormat={false}
              value={seatDate}
              initialValue={seatDate}
              closeOnSelect={true}
              onChange={selectedDate => {dateChange(selectedDate || Today)}}
            />
          </div>
        </div>
        
        <LeafletMain
          ref={childRef}
          seatDate={seatDate}
          floor={floor}
          getSeatDate={getSeatDate}
          getFloor={getFloor}
        />
      </div>
    );
}

export default App;