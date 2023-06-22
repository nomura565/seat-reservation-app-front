import { icon } from 'leaflet';
import React, { useState,useRef  } from 'react'
import { Marker, Popup,Tooltip,useMapEvents, useMap } from 'react-leaflet'

import Box from '@mui/material/Box';
import { TextField,Button,ButtonGroup,FormControlLabel,Checkbox,Tooltip as MaterialTooltip } from "@mui/material";

import { formatDate} from "./Const";

import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";

import axios from "axios";
import {API_URL} from "./Const";

import LeafletDialog from "./LeafletDialog";

import { useCookies } from "react-cookie";

const LeafletMarker = (props) => {
  const occupyIcon = new icon({
    iconUrl: 'occupy.png',
    iconSize:     [25, 25], // size of the icon
    className:props.iconClass
  });
  
  const permanentIcon = new icon({
    iconUrl: 'permanent.png',
    iconSize:     [25, 25], // size of the icon
    className:props.iconClass
  });

  const addIcon = new icon({
    iconUrl: 'add.png',
    iconSize:     [25, 25], // size of the icon
    className:props.iconClass
  });
  
  const freeIcon = new icon({
    iconUrl: 'free.png',
    iconSize:     [14, 25], // size of the icon
    className:props.iconClass
  });
  
  const UpdateMode = {
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
  let flg = true;
  var name = props.userName;
  var user_name = props.userName;
  //console.log(map);
  const [cookies, setCookie, removeCookie] = useCookies();
  if(name == null){
    user_name = (cookies.userName !== 0) ? cookies.userName: "";
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

  const [open, setOpen] = useState(false);
  const [dialogTitleMessage, setDialogTitleMessage] = useState(useSeatResultText);
  const [dialogContentMessage, setDialogContentMessage] = useState("");
  const [refreshFlg, setRefreshFlg] = useState(false);
  const [permanentFlg, setPermanentFlg] = useState(false);
  let tooltip_direction = props.tooltip_direction;
  if(tooltip_direction == null){
    tooltip_direction = "auto";
  }
  const [tooltipDirection, setTooltipDirection] = useState(tooltip_direction);
  const [position, setPosition] = useState(props.position);
  const [admin, setAdmin] = useState(props.admin);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    
    if(refreshFlg){
      props.getCurrentSeatList();
      setRefreshFlg(false);
    }
    
  };

  let popupRef = useRef();

  //this.handleChange = this.handleChange.bind(this);

  const dialogOpen = (titleText, ContextText) => {
    setDialogTitleMessage(titleText);
    setDialogContentMessage(ContextText);
    handleClickOpen();
  }
  const InsertFail = () => {
    setRefreshFlg(true);
    dialogOpen(APIErrorResultText, "登録に失敗しました。座席一覧を再読み込みします。");
  }

  const onClickButton = (argFlg) => {
    let from_date = fromDate;
    let to_date;

    if(argFlg){
      let temp = (userName === null)? "":userName;
      if(temp.trim() === ""){
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
        user_name: userName,
        permanent_flg: permanentFlg
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
          let text = userName + "さんを" + from_date + "～" + to_date + "で座席登録しました。";
          if(permanentFlg) text = userName + "さんを固定席で座席登録しました。";
          dialogOpen(useSeatResultText, text);
          setUseSeatFlg(argFlg);
          setRefreshFlg(true);
          const cookieDate = new Date();
          cookieDate.setDate(cookieDate.getDate() + 7);
          setCookie("userName", userName, { expires: cookieDate, path: '/' });
        }else{
          //console.log(response);
          InsertFail();
          return;
        }
        
      })
      .catch((response) => {
        //console.log(response);
        InsertFail();
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
          setRefreshFlg(true);
        }else{
          //console.log(response);
          InsertFail();
          return;
        }
        
      })
      .catch((response) => {
        //console.log(response);
        InsertFail();
        return;
      });;

    }
    props.map.closePopup();
    //console.log(argFlg);
  };
  const userNameChange = (e) => {
    setUserName(e.target.value);
  }

  const toDateChange = (selectedDate) => {
    setToDate(selectedDate);
  }

  const handleChange = (e) => {
    setPermanentFlg(e.target.checked);
  }

  const parentMap = useMap();
  const markerRef = useRef(null);

  const eventHandlers = {
    dragstart: () => {
      const marker = markerRef.current;
      marker.setOpacity(0.6);
    },
    dragend: () => {
      const marker = markerRef.current;
      const AfterPosition = marker.getLatLng()
      marker.setOpacity(1);
      setPosition([AfterPosition.lat, AfterPosition.lng]);
      props.setPositionForSeatList(seatId, AfterPosition.lat, AfterPosition.lng);
    },
    click:() => {
      props.markerDelete(seatId);
    }
  }

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

  const getIcon = () => {
    if(props.seatDate === "add") {
      return addIcon;
    }
    if(admin){
      return freeIcon;
    }
    if(props.isPermanent){
      return permanentIcon;
    }
    if(useSeatFlg){
      return occupyIcon;
    }else{
      return freeIcon;
    }
  }

  return (
        <Marker ref={markerRef} draggable={admin} eventHandlers={eventHandlers} position={props.position} icon={getIcon()}>
        <Tooltip direction={tooltipDirection} permanent={props.tooltipPermanent && (admin ||useSeatFlg)}><b>{admin?seatId:popupText}{props.isPermanent ? "":""}</b></Tooltip>
          {admin
            ? ""
            :
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
            <div className={useSeatFlg ? "unuse":""}>
            <MaterialTooltip title="固定席の場合、他の席情報を強制的に削除します">
                <FormControlLabel required control={<Checkbox onChange={handleChange} size="small" />} label="固定席にする" />
              </MaterialTooltip>
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
          }
          <LeafletDialog
            open={open}
            handleClose={handleClose}
            dialogTitleMessage={dialogTitleMessage}
            dialogContentMessage={dialogContentMessage}
          />
        </Marker>
    )
}

export default LeafletMarker;