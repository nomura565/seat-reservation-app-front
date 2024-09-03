import Leaflet from 'leaflet';
import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import LeafletMain from './components/Leaflet';
import { API_URL, selectSeatDateAtom, selectFloorAtom, floorListAtom, isLoadingAtom, SITTING_CONFIRM_TIME, SITTING_CONFIRM_ENABLE_FLG } from "./components/Const";
import { formatDateToString, parseStringToDate, isAfterHour } from "./components/FormatDate";

import "react-datetime/css/react-datetime.css";

import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Button } from "@mui/material";

import TemporaryDrawer from './components/TemporaryDrawer';
import { isBrowser } from "react-device-detect";
import FloorAndDate from './components/FloorAndDate';
import CommentDrawer from './components/CommentDrawer';
import { useAtom, useSetAtom } from 'jotai';
import FacilitySchedule from './components/FacilitySchedule';
import Progress from './components/Progress';
import Grid from '@mui/material/Grid';

/** メッセージ */
const MESSAGE = {
  EDIT_BUTTON: "座席位置登録",
  ILLEGAL_DATE: "不正な日付"
}

Leaflet.Icon.Default.imagePath =
  '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/'

const App = () => {
  const childRef = useRef();
  const [selectSeatDate, setSelectSeatDate] = useAtom(selectSeatDateAtom);
  const [selectFloor, setSelectFloor] = useAtom(selectFloorAtom);
  //管理モードパラメータ
  const [searchParams, setSearchParams] = useSearchParams();
  const paramAdmin = searchParams.get('admin');
  const admin = (paramAdmin === null) ? false : paramAdmin;

  const [floorList, setFloorList] = useAtom(floorListAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);
  const [sittingConfirm, setSittingConfirm] = useState(false);

  useEffect(() => {
    //読み込み時オフィス一覧を取得する
    getFloorList();
    if(SITTING_CONFIRM_ENABLE_FLG) setSittingConfirm(true);
  }, [])

  useEffect(() => {
    if(sittingConfirm === true){
      //12時以降の場合、在席チェックを実行する
      if(isAfterHour(SITTING_CONFIRM_TIME)){
        setSittingConfirm(true);
        axios
        .post(API_URL.SITTING_CONFIRM, {
          seat_date: formatDateToString(new Date())
        });
      }
    }
  }, [sittingConfirm])

  /** オフィス一覧を取得 */
  const getFloorList = () => {
    setIsLoading(true);
    axios
      .get(API_URL.FLOOR)
      .then((response) => {
        setIsLoading(false);
        setFloorList(response.data);
      });
  }
  /** オフィス変更イベント */
  const handleChange = (e) => {
    setSelectFloor(e.target.value);

    let temp = floorList.find(floor => floor["floor_id"] === e.target.value);
    //Leaflet.jsの処理呼び出し
    //オフィス画像をセット
    childRef.current.setFloorMapFromParent(temp["floor_map"]);
    //席一覧を取得
    childRef.current.changeSeatList(selectSeatDate, e.target.value);
  };
  /** 席日付変更イベント */
  const dateChange = (seatDate) => {
    try {
      let date = formatDateToString(seatDate);
      setSelectSeatDate(date);
      childRef.current.changeSeatList(seatDate, selectFloor);
    } catch {
      console.log(MESSAGE.ILLEGAL_DATE);
    }
  }

  /** 指定日付での席一覧取得 */
  const dateChangeYmd = (dateYmd) => {
    setSelectSeatDate(dateYmd);
    childRef.current.changeSeatList(parseStringToDate(dateYmd), selectFloor);
  }

  const getSeatDate = () => {
    return selectSeatDate;
  }

  /** 座席位置登録ボタン押下イベント */
  const onClickButton = () => {
    childRef.current.updateSeatLatLng();
  }

  return (
    <div className={!isBrowser ? "parent" : ""}>
      {!isBrowser
        ?
        <TemporaryDrawer
          floor={selectFloor}
          handleChange={handleChange}
          dateChange={dateChange}
        />
        :
        <Grid container >
          <FloorAndDate
            handleChange={handleChange}
            dateChange={dateChange}
          />
          {admin && 
            <Button className="edit-button" variant="outlined" onClick={onClickButton}>{MESSAGE.EDIT_BUTTON}</Button>
          }
        </Grid>
      }
      <LeafletMain
        ref={childRef}
        seatDate={selectSeatDate}
        getSeatDate={getSeatDate}
        admin={admin}
        dateChangeYmd={dateChangeYmd}
      />
      <CommentDrawer / >
      <FacilitySchedule />
      <Progress />
    </div>
  );
}

export default App;