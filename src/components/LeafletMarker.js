import { icon } from 'leaflet';
import React, { useState,useRef  } from 'react'
import { Marker, Popup,Tooltip,useMapEvents, useMap } from 'react-leaflet'

import Box from '@mui/material/Box';
import { TextField,Button,ButtonGroup } from "@mui/material";

import { formatDate} from "./Const";

import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import axios from "axios";
import {API_URL} from "./Const";

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

var occupyIcon = new icon({
  iconUrl: 'occupy.png',
  iconSize:     [25, 25], // size of the icon
});

var freeIcon = new icon({
  iconUrl: 'free.png',
  iconSize:     [14, 25], // size of the icon
});

var UpdateMode = {
  default : 1,
  update : 2,
  unseat : 3
};

let currentUpdateMode = UpdateMode.default;
const unUseSeatText = "空席";
const useSeatResultText = "座席登録";
const unUseSeatResultText = "空席登録";
const validationErrorResultText = "バリデーションエラー";
const APIErrorResultText = "APIエラー";

const LeafletMarker = ({props, map}) => {
  let flg = true;
  var name = props.userName;
  var user_name = props.userName;
  //console.log(map);
  if(name == null){
    user_name = "";
    flg = false;
    name = unUseSeatText;
  }
  const Today = new Date();

  const [userName, setUserName] = useState(user_name);
  const [fromDate, setFromDate] = useState(formatDate(Today));
  const [toDate, setToDate] = useState(Today);

  const [defaultUserName, setDefaultUserName] = useState(user_name);

  const [popupText, setPopupText] = useState(name);
  const [useSeatFlg, setUseSeatFlg] = useState(flg);
  const [seatId, setSeatId] = useState(props.seatId);

  const [open, setOpen] = React.useState(false);
  const [dialogTitleMessage, setDialogTitleMessage] = useState(useSeatResultText);
  const [dialogContentMessage, setDialogContentMessage] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  let popupRef = useRef();

  //this.handleChange = this.handleChange.bind(this);

  const dialogOpen = (titleText, ContextText) => {
    setDialogTitleMessage(titleText);
    setDialogContentMessage(ContextText);
    handleClickOpen();
  }

  const onClickButton = (argFlg) => {
    let from_date = fromDate;
    let to_date;

    if(argFlg){
      if(userName.trim() === ""){
        dialogOpen(validationErrorResultText, "名前が入力されていません。");
        return;
      }

      try {
        to_date = formatDate(toDate);

        let tmpFDate = new Date(fromDate);
        let tmpTDate = new Date(to_date);
        if(tmpFDate.getTime() > tmpTDate.getTime()){
          dialogOpen(validationErrorResultText, "日付の期間が正しくありません。");
          return;
        }
      }catch{
        dialogOpen(validationErrorResultText, "正しい日付が入力されていません。");
        return;
      }

      currentUpdateMode = UpdateMode.update;
      axios
      .post(API_URL.INSERT, {
        seat_id: seatId,
        from_date: from_date,
        to_date: to_date,
        user_name: userName
      })
      .then((response) => {
        //console.log(response);
        if(response.status === 200){
          setUserName(userName);
          setDefaultUserName(userName);
          setPopupText(userName);
          let tmpDate = props.getSelectedDate();
          setFromDate(formatDate(tmpDate));
          setToDate(tmpDate);
          dialogOpen(useSeatResultText, 
            userName + "さんを" + from_date + "～" + to_date + "で座席登録しました。");
          setUseSeatFlg(argFlg);
        }else{
          //console.log(response);
          dialogOpen(APIErrorResultText, "登録に失敗しました。ページを再読み込みしてから再登録してください。");
          return;
        }
        
      })
      .catch((response) => {
        //console.log(response);
        dialogOpen(APIErrorResultText, "登録に失敗しました。ページを再読み込みしてから再登録してください。");
        return;
      });
    } else {
      currentUpdateMode = UpdateMode.unseat;

      let selectedDate = formatDate(props.getSelectedDate());
      const sendData = {
        seat_id: seatId,
        seat_date: selectedDate
      }
      
      axios
      .delete(API_URL.DELETE, {
        data: sendData
      })
      .then((response) => {
        //console.log(response);//response.data == 204 →OK
        if(response.status === 204){
          setUserName("");
          setDefaultUserName("");
          setPopupText(unUseSeatText);
          let tmpDate = props.getSelectedDate();
          setFromDate(formatDate(tmpDate));
          setToDate(tmpDate);
          dialogOpen(unUseSeatResultText, 
            from_date + "の座席を空席にしました。");
          setUseSeatFlg(argFlg);
        }else{
          //console.log(response);
          dialogOpen(APIErrorResultText, "登録に失敗しました。ページを再読み込みしてから再登録してください。");
          return;
        }
        
      })
      .catch((response) => {
        //console.log(response);
        dialogOpen(APIErrorResultText, "登録に失敗しました。ページを再読み込みしてから再登録してください。");
        return;
      });;

    }
    map.closePopup();
    //console.log(argFlg);
  };
  const userNameChange = (e) => {
    setUserName(e.target.value);
  }

  const toDateChange = (selectedDate) => {
    setToDate(selectedDate);
  }

  const parentMap = useMap();

  const mapEvents = useMapEvents({
    popupopen(e) {
      //console.log("popupopen");
      currentUpdateMode = UpdateMode.default;
      let tmpDate = props.getSelectedDate();
      setFromDate(formatDate(tmpDate));
      setToDate(tmpDate);

      setTimeout(function(){
        parentMap.setView(e.popup._latlng, parentMap.getZoom());
      }, 10);

    },
    popupclose(e) {
      //console.log("popupclose");
      if(currentUpdateMode === UpdateMode.default){
        //console.log("default");
        setUserName(defaultUserName);
        let tmpDate = props.getSelectedDate();
        setFromDate(formatDate(tmpDate));
        setToDate(tmpDate);
      }else{
        currentUpdateMode = UpdateMode.default;
      }
    }
  })

  return (
        <Marker position={props.position} icon={useSeatFlg ? occupyIcon:freeIcon}>
        <Tooltip><b>{popupText}</b></Tooltip>
          <Popup
            ref={(r) => {
              popupRef = r;
            }}
          >
          <Box
            component="form"
            sx={{
              '& .MuiTextField-root': { m: 1, width: '25ch' },
            }}
            noValidate
            autoComplete="off"
          >
            <div><TextField id="outlined-basic" name="userName" value={userName} onChange={userNameChange} label="名前" variant="standard" size="small" /></div>
            <div className={useSeatFlg ? "use-seat-date":"unuse-seat-date"}>
              <input
                className="date-input"
                value={fromDate}
                disabled={true}
              />
              ～
              <Datetime
                locale='ja'
                inputProps={
                  {"className":"date-input"}
                }
                dateFormat="YYYY/MM/DD"
                timeFormat={false}
                value={toDate}
                initialValue={toDate}
                closeOnSelect={true}
                onChange={(selectedDate) => {toDateChange((selectedDate || Today))}}
              />
            </div>
            <div><ButtonGroup size="small" aria-label="small button group">
            <div className={useSeatFlg ? "unuse":""}>
              <Button onClick={() => onClickButton(true)}>座席登録</Button>
            </div>
            <div className={useSeatFlg ? "":"unuse"}>
            <Button onClick={() => onClickButton(false)}>{unUseSeatText}にする</Button>
            </div>
            </ButtonGroup></div>
          </Box>
          
          </Popup>
          <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            PaperProps={{
              style: {
                maxWidth: '300px',
                boxShadow: 'none',
              },
            }}
          >
            <DialogTitle id="alert-dialog-title">
              {dialogTitleMessage}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
              {dialogContentMessage}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} autoFocus>
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </Marker>
    )
}

export default LeafletMarker;