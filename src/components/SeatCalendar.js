import React, { useState, useImperativeHandle, forwardRef, useCallback } from 'react'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { Button } from "@mui/material";
import { API_URL } from "./Const";
import axios from "axios";
import { formatDateToString, parseStringToDate, formatDateToYM, addDayStringDateToString, addHourStringDateToDate } from "./FormatDate";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup the localizer by providing the moment (or globalize, or Luxon) Object
// to the correct localizer.
const localizer = momentLocalizer(moment) // or globalizeLocalizer

/** メッセージ */
const MESSAGE = {
  CLOSE_BUTTON: "閉じる",
}

const SeatCalendar = (props, ref) => {
  //席ID
  const [seatId, setSeatId] = useState(props.seatId);
  //YM
  let currentDateYm = formatDateToYM(props.fromDate);
  //YYYYMMDD
  const [dateYmd, setDateYmd] = useState(parseStringToDate(props.fromDate));
  //席ID
  let tmpCalendarList = [];
  const [calendarList, setCalendarList] = useState(tmpCalendarList);
  //日付変更時コールバック
  const onNavigate = useCallback((newDate) => {
    const _newDateYm = formatDateToYM(newDate);
    if(_newDateYm !== currentDateYm){
      getCalendarList(seatId, formatDateToString(newDate));
    }
  }, [seatId, currentDateYm]);

  //呼び出し元からの参照
  useImperativeHandle(ref, () => ({
    //カレンダー一覧を取得する
    onClickCalendarButton: (_seatId, _fromDate) => {
      getCalendarList(_seatId, _fromDate);
    },
  }))

  /** カレンダー一覧を取得する。 */
  const getCalendarList = (_seatId, _fromDate) => {
    setCalendarList([]);

    const _dateYm = formatDateToYM(_fromDate);
    setSeatId(_seatId);
    currentDateYm = _dateYm;
    setDateYmd(parseStringToDate(_fromDate));

    axios
      .post(API_URL.CALENDAR, {
        seat_id: _seatId,
        date_ym: _dateYm
      })
      .then((response) => {
        makeCalendarList(response.data);
      })
      .catch((error) => {
        console.log(error.message);
        return;
      });;
  }
  /** レスポンスからカレンダー一覧の形式に変えてセットする */
  const makeCalendarList = (calendarList) => {
    let _calendarList = [];
    calendarList.map((calendar) => {
      //すでに一覧に追加した中に同じ名前、かつ昨日の日付のものがあれば抽出
      const yesterday = addDayStringDateToString(calendar.seat_date, -1);
      const alreadyAdded = _calendarList.find((_calendar)=> {
        return (_calendar.title === calendar.user_name && formatDateToString(_calendar.end) === yesterday);
      });
      //存在したらそこの終了日を更新　0時だとカレンダーの表示上日を跨がないので適当に時間を加算
      if(typeof alreadyAdded !== "undefined"){
        alreadyAdded.end = addHourStringDateToDate(calendar.seat_date, 12);
      }else{
        let addCalendar = {
          title: calendar.user_name,
          start: parseStringToDate(calendar.seat_date),
          end: parseStringToDate(calendar.seat_date),
          allDay: true
        }
        _calendarList = [..._calendarList, addCalendar];
      }
    });
    setCalendarList(_calendarList);
  }

  return (
    <div className="myCustomHeight">
      <Dialog
        open={props.open}
        onClose={props.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            maxWidth: '600px',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Calendar
              localizer={localizer}
              views={['month']}
              events={calendarList}
              startAccessor="start"
              endAccessor="end"
              style={{ width: 500, height: 400 }}
              onNavigate={onNavigate}
              defaultDate={dateYmd}
              Date={dateYmd}
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.handleClose} autoFocus>
            {MESSAGE.CLOSE_BUTTON}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default forwardRef(SeatCalendar);