import Leaflet from 'leaflet';
import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import LeafletMain from './components/Leaflet';
import { API_URL } from "./components/Const";
import { formatDateToString, parseStringToDate } from "./components/FormatDate";

import "react-datetime/css/react-datetime.css";

import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Button } from "@mui/material";

import TemporaryDrawer from './components/TemporaryDrawer';
import { isMobile } from "react-device-detect";
import FloorAndDate from './components/FloorAndDate';

/** メッセージ */
const MESSAGE = {
  EDIT_BUTTON: "座席位置登録",
  ILLEGAL_DATE: "不正な日付"
}

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
  const [admin, setAdmin] = useState((paramAdmin === null) ? false : paramAdmin);

  const [floorList, setFloorList] = useState(tmpFloorList);

  useEffect(() => {
    //読み込み時オフィス一覧を取得する
    getFloorList();
  }, [])

  /** オフィス一覧を取得 */
  const getFloorList = () => {
    axios
      .get(API_URL.FLOOR)
      .then((response) => {
        setFloorList(response.data);
      });
  }
  /** オフィス変更イベント */
  const handleChange = (e) => {
    setFloor(e.target.value);

    let temp = floorList.find(floor => floor["floor_id"] === e.target.value);
    //Leaflet.jsの処理呼び出し
    //オフィス画像をセット
    childRef.current.setFloorMapFromParent(temp["floor_map"]);
    //席一覧を取得
    childRef.current.changeSeatList(seatDate, e.target.value);
  };
  /** 席日付変更イベント */
  const dateChange = (selectedDate) => {
    try {
      let date = formatDateToString(selectedDate);
      setSeatDate(date);
      childRef.current.changeSeatList(selectedDate, floor);
    } catch {
      console.log(MESSAGE.ILLEGAL_DATE);
    }
  }

  /** 指定日付での席一覧取得 */
  const dateChangeYmd = (dateYmd) => {
    setSeatDate(dateYmd);
    childRef.current.changeSeatList(parseStringToDate(dateYmd), floor);
  }

  const getSeatDate = () => {
    return seatDate;
  }

  const getFloor = () => {
    return floor;
  }

  /** 座席位置登録ボタン押下イベント */
  const onClickButton = () => {
    childRef.current.updateSeatLatLng();
  }

  return (
    <div className={isMobile ? "parent" : ""}>
      {isMobile
        ?
        <TemporaryDrawer
          floor={floor}
          handleChange={handleChange}
          floorList={floorList}
          seatDate={seatDate}
          dateChange={dateChange}
        />
        :
        <div className='date-container'>
          <FloorAndDate
            floor={floor}
            handleChange={handleChange}
            floorList={floorList}
            seatDate={seatDate}
            dateChange={dateChange}
          />
          {admin
            ?
            <Button className="edit-button" variant="outlined" onClick={onClickButton}>{MESSAGE.EDIT_BUTTON}</Button>
            : ""
          }
        </div>
      }
      <LeafletMain
        ref={childRef}
        seatDate={seatDate}
        floor={floor}
        getSeatDate={getSeatDate}
        getFloor={getFloor}
        admin={admin}
        dateChangeYmd={dateChangeYmd}
      />
    </div>
  );
}

export default App;