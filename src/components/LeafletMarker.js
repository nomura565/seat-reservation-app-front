import { icon } from 'leaflet';
import React, { useState,useRef  } from 'react'
import { Marker, Popup,Tooltip,useMapEvents, useMap } from 'react-leaflet'
import Box from '@mui/material/Box';
import { TextField,Button,ButtonGroup,FormControlLabel,Checkbox,Tooltip as MaterialTooltip } from "@mui/material";
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import axios from "axios";
import {API_URL, formatDate, DATE_FORMAT} from "./Const";
import LeafletDialog from "./LeafletDialog";
import { useCookies } from "react-cookie";
import Resizer from "react-image-file-resizer";
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import ChairAltIcon from '@mui/icons-material/ChairAlt';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { format } from 'react-string-format';

const MESSAGE = {
  UNSEAT: "空席",
  DIALOG_SEAT_REGIST_TITLE: "座席登録",
  DIALOG_SEAT_REGIST_DETAIL: "{0}さんを{1}～{2}で座席登録しました。",
  DIALOG_PERMANENT_SEAT_REGIST_DETAIL: "{0}さんを固定席で座席登録しました。",
  DIALOG_UNSEAT_REGIST_TITLE: "空席登録",
  DIALOG_UNSEAT_REGIST_DETAIL: "{0}の座席を空席にしました。",
  DIALOG_API_FAIL_TITLE: "APIエラー",
  DIALOG_API_FAIL_DETAIL: "登録に失敗しました。座席一覧を再読み込みします。",
  DIALOG_VALID_FAIL_TITLE: "バリデーションエラー",
  DIALOG_VALID_FAIL_DETAIL_NAME_EMPTY: "名前が入力されていません。",
  DIALOG_VALID_FAIL_DETAIL_DATE_TERM_ILLEGAL: "日付の期間が正しくありません。",
  DIALOG_VALID_FAIL_DETAIL_DATE_ILLEGAL: "正しい日付が入力されていません。",
  ICON_UPLOAD_BUTTON: "アイコンアップロード",
  NAME: "名前",
  PARMANENT_TOOLTIP_TITLE: "固定席の場合、他の席情報を強制的に削除します",
  PARMANENT: "固定席にする",
  SEAT_REGIST_BUTTON: "座席登録",
  UNSEAT_REGIST_BUTTON: "空席にする",
}

const LeafletMarker = (props) => {
  //使用中アイコン
  const occupyIcon = new icon({
    iconUrl: 'occupy.png',
    iconSize:     [25, 25], // size of the icon
    className:props.iconClass
  });
  //固定席アイコン
  const permanentIcon = new icon({
    iconUrl: 'permanent.png',
    iconSize:     [25, 25], // size of the icon
    className:props.iconClass
  });
  //追加席アイコン
  const addIcon = new icon({
    iconUrl: 'add.png',
    iconSize:     [25, 25], // size of the icon
    className:props.iconClass
  });
  //自由席アイコン
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

  //席が使用中かのフラグ
  let flg = true;
  //dialogで使う名前
  var name = props.userName;
  //toolipで使う名前
  var user_name = props.userName;
  const [cookies, setCookie, removeCookie] = useCookies();
  //初期状態だとnullとなり表示にnullと出てしまうので対応
  if(name == null){
    //クッキーに名前があればそれをdialogで使う名前にする
    user_name = (cookies.userName !== 0) ? cookies.userName: "";
    flg = false;
    name = MESSAGE.UNSEAT;
  }
  const Today = new Date();

  const [userName, setUserName] = useState(user_name);
  const [fromDate, setFromDate] = useState(formatDate(Today));
  const [toDate, setToDate] = useState(Today);
  //dialogで使う名前　入力して登録せず閉じたときに元に戻す用
  const [defaultUserName, setDefaultUserName] = useState(user_name);
  //toolipで使う名前
  const [popupText, setPopupText] = useState(name);
  //席が使用中かのフラグ
  const [useSeatFlg, setUseSeatFlg] = useState(flg);
  //席ID
  const [seatId, setSeatId] = useState(props.seatId);

  const [open, setOpen] = useState(false);
  //dialogのタイトルメッセージ
  const [dialogTitleMessage, setDialogTitleMessage] = useState(MESSAGE.DIALOG_SEAT_REGIST_TITLE);
  //dialogのコンテントメッセージ
  const [dialogContentMessage, setDialogContentMessage] = useState("");
  //席情報等をリフレッシュするかのフラグ
  const [refreshFlg, setRefreshFlg] = useState(false);
  //固定席フラグ
  const [permanentFlg, setPermanentFlg] = useState(false);
  //tooltipの表示向き　指摘がなければauto
  let tooltip_direction = props.tooltip_direction;
  if(tooltip_direction == null){
    tooltip_direction = "auto";
  }
  const [tooltipDirection, setTooltipDirection] = useState(tooltip_direction);
  //席の位置座標
  const [position, setPosition] = useState(props.position);
  //管理モードかのフラグ
  const [admin, setAdmin] = useState(props.admin);
  //アイコン
  const [imageData, setImageData] = useState(null);
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const inputFileRef = useRef();

  const handleClickOpen = () => {
    setOpen(true);
  };
  //dialogクローズイベント
  const handleClose = () => {
    setOpen(false);
    
    if(refreshFlg){
      props.getCurrentSeatList();
      setRefreshFlg(false);
    }
    
  };

  let popupRef = useRef();
  //dialogオープンイベント
  const dialogOpen = (titleText, ContextText) => {
    setDialogTitleMessage(titleText);
    setDialogContentMessage(ContextText);
    handleClickOpen();
  }
  //登録失敗
  const InsertFail = () => {
    setRefreshFlg(true);
    dialogOpen(MESSAGE.DIALOG_API_FAIL_TITLE, MESSAGE.DIALOG_API_FAIL_DETAIL);
  }
  //座席登録ボタン押下イベント
  const onClickButton = (argFlg) => {
    let from_date = fromDate;
    let to_date;
    //座席登録
    if(argFlg){
      let temp = (userName === null)? "":userName;
      if(temp.trim() === ""){
        dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_NAME_EMPTY);
        return;
      }

      try {
        to_date = formatDate(toDate);

        let tmpFDate = new Date(fromDate);
        let tmpTDate = new Date(to_date);
        if(tmpFDate.getTime() > tmpTDate.getTime()){
          dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_DATE_TERM_ILLEGAL);
          return;
        }
      }catch{
        dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_DATE_ILLEGAL);
        return;
      }

      currentUpdateMode = UpdateMode.update;
      axios
      .post(API_URL.INSERT, {
        seat_id: seatId,
        from_date: from_date,
        to_date: to_date,
        user_name: userName,
        permanent_flg: permanentFlg,
        image_data: imageData
      })
      .then((response) => {
        if(response.status === 200){
          setUserName(userName);
          setDefaultUserName(userName);
          setPopupText(userName);
          let tmpDate = props.getSelectedDate();
          setFromDate(formatDate(tmpDate));
          setToDate(tmpDate);
          let text =  format(MESSAGE.DIALOG_SEAT_REGIST_DETAIL, userName, from_date, to_date);
          if(permanentFlg) text = format(MESSAGE.DIALOG_PERMANENT_SEAT_REGIST_DETAIL, userName);
          dialogOpen(MESSAGE.DIALOG_SEAT_REGIST_TITLE, text);
          setUseSeatFlg(argFlg);
          setRefreshFlg(true);
          const cookieDate = new Date();
          cookieDate.setDate(cookieDate.getDate() + 7);
          setCookie("userName", userName, { expires: cookieDate, path: '/' });
        }else{
          InsertFail();
          return;
        }
        
      })
      .catch((response) => {
        InsertFail();
        return;
      });
    } else {
      //空席登録
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
        if(response.status === 204){
          setUserName("");
          setDefaultUserName("");
          setPopupText(MESSAGE.UNSEAT);
          let tmpDate = props.getSelectedDate();
          setFromDate(formatDate(tmpDate));
          setToDate(tmpDate);
          dialogOpen(MESSAGE.DIALOG_UNSEAT_REGIST_TITLE, 
            format(MESSAGE.DIALOG_UNSEAT_REGIST_DETAIL, from_date));
          setUseSeatFlg(argFlg);
          setRefreshFlg(true);
        }else{
          InsertFail();
          return;
        }
        
      })
      .catch((response) => {
        InsertFail();
        return;
      });;

    }
    props.map.closePopup();
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
    //席のドラッグ開始　席を半透明にする
    dragstart: () => {
      const marker = markerRef.current;
      marker.setOpacity(0.6);
    },
    //席のドラッグ終了　席情報を更新する
    dragend: () => {
      const marker = markerRef.current;
      const AfterPosition = marker.getLatLng();
      marker.setOpacity(1);
      setPosition([AfterPosition.lat, AfterPosition.lng]);
      props.setPositionForSeatList(seatId, AfterPosition.lat, AfterPosition.lng);
    },
    //席クリック　削除するかはmarkerDeleteで判定
    click:() => {
      props.markerDelete(seatId);
    }
  }

  //指定の座標に中心が移動する
  const setViewCurrentLatlng = (_lat, _lng) => {
    const latlng = {
      "lat":_lat,
      "lng":_lng
    }
    setLat(_lat);
    setLng(_lng);
    setTimeout(function(){
      parentMap.setView(latlng, parentMap.getZoom());
    }, 10);
  }

  const mapEvents = useMapEvents({
    popupopen(e) {
      currentUpdateMode = UpdateMode.default;
      let tmpDate = props.getSelectedDate();
      setFromDate(formatDate(tmpDate));
      setToDate(tmpDate);
      setImageData(null);
      //座席アイコンが押下された時に中央に移動する
      setViewCurrentLatlng(e.popup._latlng.lat +20, e.popup._latlng.lng);

    },
    popupclose(e) {
      if(currentUpdateMode === UpdateMode.default){
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
  //アイコンのファイル選択時イベント
  const onFileChange = async(e) => {
    const files = e.target.files
    if (files.length > 0) {
        const file = e.target.files[0];
        const image = await resizeFile(file);
        setImageData(image);
        setViewCurrentLatlng(lat+100, lng);
    } else {
      setImageData(null);
    }
  }
  //リサイズ処理
  const resizeFile = (file) => {
    return new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        100,
        100,
        'JPEG',
        100,
        0,
        (uri) => {
          resolve(uri)
        },
        'base64'
      )
    })
  }

  const onClickfileUploadButton = () => {
    inputFileRef.current.click();
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
            <div className={useSeatFlg ? "unuse":""}>
              <Button size="small" variant="contained" startIcon={<FaceRetouchingNaturalIcon />}
              onClick={() => onClickfileUploadButton()}>{MESSAGE.ICON_UPLOAD_BUTTON}</Button>
              <div className="image">
                <input type="file" accept="image/*" 
                  hidden ref={inputFileRef}
                  onChange={(e) => onFileChange(e)}
                />
                <div>
                  <img src={imageData} />
                </div>
              </div>
            </div>
            <div className={useSeatFlg ? "image":"unuse"}>
              <img src={props.image} />
            </div>
            <div><TextField id="outlined-basic" disabled={useSeatFlg} name="userName" value={userName} onChange={userNameChange} label={MESSAGE.NAME} variant="standard" size="small" /></div>
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
                  {"className":"date-input","readOnly":"readOnly"}
                }
                dateFormat={DATE_FORMAT}
                timeFormat={false}
                value={toDate}
                initialValue={toDate}
                closeOnSelect={true}
                onChange={(selectedDate) => {toDateChange((selectedDate || Today))}}
              />
              
            </div>
            <div className={useSeatFlg ? "unuse":""}>
            <MaterialTooltip placement="right" title={MESSAGE.PARMANENT_TOOLTIP_TITLE}>
                <FormControlLabel required control={<Checkbox onChange={handleChange} size="small" />} label={MESSAGE.PARMANENT} />
              </MaterialTooltip>
            </div>
            <div><ButtonGroup size="small" aria-label="small button group">
            <div className={useSeatFlg ? "unuse":""}>
              <Button startIcon={<ChairAltIcon />} onClick={() => onClickButton(true)}>{MESSAGE.SEAT_REGIST_BUTTON}</Button>
            </div>
            <div className={useSeatFlg ? "":"unuse"}>
            <Button startIcon={<PersonRemoveIcon />} onClick={() => onClickButton(false)}>{MESSAGE.UNSEAT_REGIST_BUTTON}</Button>
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