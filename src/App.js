import Leaflet from 'leaflet';
import React, { useState,useRef,useEffect } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import LeafletMain from './components/Leaflet';
import {API_URL,formatDate} from "./components/Const";

import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Button } from "@mui/material";

Leaflet.Icon.Default.imagePath =
  '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/'

  const App = () => {
    const childRef = useRef();
    const Today = new Date();
    const [seatDate, setSeatDate] = useState(Today);
    const [floor, setFloor] = React.useState("1");
    let tmpFloorList = [];
    //管理モードパラメータ
    const [searchParams, setSearchParams] = useSearchParams();
    const paramAdmin = searchParams.get('admin');
    const [admin, setAdmin] = useState((paramAdmin === null)? false:paramAdmin);
  
    const [floorList, setFloorList] = useState(tmpFloorList);

    useEffect(() =>{
      //読み込み時オフィス一覧を取得する
      getFloorList();
    },[])

    const getFloorList = () => {
      axios
        .get(API_URL.FLOOR)
        .then((response) => {
          setFloorList(response.data);
        });
    }
    //オフィス変更イベント
    const handleChange = (e) => {
      setFloor(e.target.value);

      let temp = floorList.find(floor => floor["floor_id"] === e.target.value);
      //Leaflet.jsの処理呼び出し
      //オフィス画像をセット
      childRef.current.setFloorMapFromParent(temp["floor_map"]);
      //席一覧を取得
      childRef.current.changeSeatList(seatDate, e.target.value);
    };
    //席日付変更イベント
    const dateChange = (selectedDate) => {
      try {
        let date = formatDate(selectedDate);
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

    const onClickButton = () => {
      childRef.current.updateSeatLatLng();
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
          {admin
            ?
            <Button className="edit-button" variant="outlined" onClick={onClickButton}>座席位置登録</Button>
            :""
          }
        </div>
        
        <LeafletMain
          ref={childRef}
          seatDate={seatDate}
          floor={floor}
          getSeatDate={getSeatDate}
          getFloor={getFloor}
          admin={admin}
        />
      </div>
    );
}

export default App;