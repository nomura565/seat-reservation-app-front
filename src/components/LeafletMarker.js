import { icon } from 'leaflet';
import React, { useState, useRef } from 'react';
import { Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import Box from '@mui/material/Box';
import { TextField, Button, FormControlLabel, Checkbox, Tooltip as MaterialTooltip } from "@mui/material";
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import axios from "axios";
import { API_URL, DATE_FORMAT, zoomAtom, selectCommentSeatIdAtom, selectSeatDateAtom
  , availableDrawerOpenAtom, availableToDateAtom, commentListInitAtom, isLoadingAtom
  , seatListAtom
  , SITTING_CONFIRM_TIME, SITTING_CONFIRM_ALERT_TIME
  , SITTING_ENABLE_FLG, SITTING_CONFIRM_ENABLE_FLG } from "./Const";
import LeafletDialog from "./LeafletDialog";
import Resizer from "react-image-file-resizer";
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import ChairAltIcon from '@mui/icons-material/ChairAlt';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { format } from 'react-string-format';
import SeatCalendar from './SeatCalendar';
import CalendarMonthTwoToneIcon from '@mui/icons-material/CalendarMonthTwoTone';
import { formatDateToString, getDateStringForChache, isAfterHour } from "./FormatDate";
import AddCommentTwoToneIcon from '@mui/icons-material/AddCommentTwoTone';
import CommentTextField from "./CommentTextField";
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import PersonOutlineTwoToneIcon from '@mui/icons-material/PersonOutlineTwoTone';
import PersonOffTwoToneIcon from '@mui/icons-material/PersonOffTwoTone';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import TextsmsOutlinedIcon from '@mui/icons-material/TextsmsOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import { isNullOrEmpty } from './CommonFunc';

const LS_KEY = "seatResavationSystemUserName";
const LS_KEY2 = "seatResavationSystemImage";

/** メッセージ */
const MESSAGE = {
  UNSEAT: "空席",
  DIALOG_SEAT_REGIST_TITLE: "座席登録",
  DIALOG_SEAT_REGIST_DETAIL: "{0}さんを{1}～{2}で座席登録しました。",
  DIALOG_PERMANENT_SEAT_REGIST_DETAIL: "{0}さんを固定席で座席登録しました。",
  DIALOG_UNSEAT_REGIST_TITLE: "空席登録",
  DIALOG_UNSEAT_REGIST_DETAIL: "{0}さんの{1}～{2}の座席を空席にしました。",
  DIALOG_UNSEAT_REGIST_DETAIL_PERMANENT: "この座席の全ての日付を空席にしました。",
  DIALOG_API_FAIL_TITLE: "APIエラー",
  DIALOG_API_FAIL_DETAIL: "登録に失敗しました。座席一覧を再読み込みします。",
  DIALOG_VALID_FAIL_TITLE: "バリデーションエラー",
  DIALOG_VALID_FAIL_DETAIL_NAME_EMPTY: "名前が入力されていません。",
  DIALOG_VALID_FAIL_DETAIL_REPLY_EMPTY: "リプライが入力されていません。",
  DIALOG_VALID_FAIL_DETAIL_DATE_TERM_ILLEGAL: "日付の期間が正しくありません。",
  DIALOG_VALID_FAIL_DETAIL_DATE_ILLEGAL: "正しい日付が入力されていません。",
  ICON_UPLOAD_BUTTON: "アイコンアップロード",
  NAME: "名前",
  PARMANENT_TOOLTIP_TITLE: "固定席の場合、他の人が予約していても過去未来の席情報を強制的に削除しますので確認してから登録してください。",
  PARMANENT: "固定席にする",
  SEAT_REGIST_BUTTON: "座席登録",
  UNSEAT_REGIST_BUTTON: "空席にする",
  API_RESPONSE_UNEXPECT: "APIのレスポンスが正常以外です",
  UNSEAT_TOOLTIP_TITLE: "複数日が選択されている場合、指定範囲の同じ名前の席を空席にします",
  SEAT_SCHEDULE_BUTTON: "この席の予定を確認する",
  COMMENT_REGIST_BUTTON: "コメントする",
  DIALOG_UNSEAT_CONFIRM_TITLE: "空席登録確認",
  DIALOG_UNSEAT_CONFIRM_DETAIL: "この座席を空席にしますか？",
  DIALOG_API_FAIL_SEAT_USE: "この座席に下記の登録がすでにあるため登録できません。",
  SITTING: "在席中と未在席を切り替える",
  UNDESIRABLE_NAME: "個人使用の場合フルネームで登録してください",
  USER_NAME_CONFIRM: "問題ないのでこの名前で登録する",
}

let currentLat = null;
let currentLng = null;

const LeafletMarker = (props) => {
  const selectCommentSeatId = useAtomValue(selectCommentSeatIdAtom);
  const selectSeatDate = useAtomValue(selectSeatDateAtom);
  const setCommentListInit = useSetAtom(commentListInitAtom);
  //席ID
  const [seatId] = useState(props.seatId);
  const setIsLoading = useSetAtom(isLoadingAtom);
  //在席フラグ
  const [sittingFlg, setSittingFlg] = useState(props.sittingFlg);

  const availableDrawerOpen = useAtomValue(availableDrawerOpenAtom);

  const [seatList, setSeatList] = useAtom(seatListAtom);

  /** 更新モード */
  const UpdateMode = {
    default: 1,
    update: 2,
    unseat: 3
  };

  let currentUpdateMode = UpdateMode.default;

  //席が使用中かのフラグ
  let flg = true;
  //dialogで使う名前
  let name = props.userName;
  //toolipで使う名前
  let user_name = props.userName;
  //初期状態だとnullとなり表示にnullと出てしまうので対応
  if (isNullOrEmpty(name)) {
    //クッキーに名前があればそれをdialogで使う名前にする
    user_name = (localStorage.getItem(LS_KEY)) ? localStorage.getItem(LS_KEY) : "";
    flg = false;
    name = MESSAGE.UNSEAT;
  }
  const Today = new Date();
  const unUseClassName = "unuse";

  const [userName, setUserName] = useState(user_name);
  const [fromDate, setFromDate] = useState(formatDateToString(selectSeatDate));
  const [toDate, setToDate] = useState(Today);
  //dialogで使う名前　入力して登録せず閉じたときに元に戻す用
  const [defaultUserName, setDefaultUserName] = useState(user_name);
  //toolipで使う名前
  const [popupText, setPopupText] = useState(name);
  //席が使用中かのフラグ
  const [useSeatFlg, setUseSeatFlg] = useState(flg);

  const [open, setOpen] = useState(false);
  //dialogのタイトルメッセージ
  const [dialogTitleMessage, setDialogTitleMessage] = useState(MESSAGE.DIALOG_SEAT_REGIST_TITLE);
  //dialogのコンテントメッセージ
  const [dialogContentMessage, setDialogContentMessage] = useState("");
  //dialogのコンテントメッセージ
  const [isSimpleDialog, setIsSimpleDialog] = useState(true);
  //席情報等をリフレッシュするかのフラグ
  const [refreshFlg, setRefreshFlg] = useState(false);
  //固定席フラグ
  const [permanentFlg, setPermanentFlg] = useState(false);
  //ユーザ名確認フラグ
  const [userNameConfirmFlg, setUserNameConfirmFlg] = useState(true);
  //tooltipの表示向き　指摘がなければauto
  let tooltip_direction = props.tooltipDirection;
  if (isNullOrEmpty(tooltip_direction)) {
    tooltip_direction = "auto";
  }
  const [tooltipDirection] = useState(tooltip_direction);
  //管理モードかのフラグ
  const [admin] = useState(props.admin);
  //アイコン
  const [imageData, setImageData] = useState(null);
  //ポップアップオープンフラグ
  const [isPoppupOpen, setIsPoppupOpen] = useState(false);
  //カレンダーオープンフラグ
  const [calendarOpen, setCalendarOpen] = useState(false);
  //席登録時のコメント
  const [comment, setComment] = useState(null);
  //コメントへのリプライ
  const [replyComment, setReplyComment] = useState("");

  let tmpReplyList = [];
  //リプライ一覧
  const [replyList, setReplyList] = useState(tmpReplyList);

  const [zoom, setZoom] = useAtom(zoomAtom);

  const availableToDate = useAtomValue(availableToDateAtom);

  const inputFileRef = useRef();
  const seatCalendarRef = useRef();

  //未在席のため削除される席の2時間前かを返す
  const isDeleteSoonSeat = () => {
    if (props.seatDate !== "add" && !props.admin && !props.isPermanent && useSeatFlg
      && !sittingFlg && isAfterHour(SITTING_CONFIRM_ALERT_TIME) && !isAfterHour(SITTING_CONFIRM_TIME)
      && props.commentReplyCount === 0){
        return true;
    } else {
      return false;
    }
  }

  const getNewIcon = (iconUrl, casheClearFlg = true) => {
    let iconClass = props.iconClass;
    if (SITTING_CONFIRM_ENABLE_FLG 
      && (selectCommentSeatId === seatId || isDeleteSoonSeat())) {
      iconClass = "blinking";
    }
    if(!props.isPermanent && !useSeatFlg && availableDrawerOpen && props.isAvailable){
      iconClass = "blinking";
    }
    const casheClear = casheClearFlg ? `?${getDateStringForChache()}` : ``;

    return new icon({
    iconUrl: `${iconUrl}${casheClear}`,
    iconSize: [25 + zoom * 10, 25 + zoom * 10], // size of the icon
    className: iconClass
    });
  }

  let sittingIconSrc = `sitting.png`;
  let sittingPermanentIconSrc = `sitting.png`;
  let casheClearFlg = true;
  //imageが登録されていればimageを表示
  if(!isNullOrEmpty(props.image)){
    sittingIconSrc = props.image;
    sittingPermanentIconSrc = props.image;
    casheClearFlg = false;
  }

  const sittingIcon = getNewIcon(sittingIconSrc, casheClearFlg);
  //未在席アイコン
  const sittingYetIcon = getNewIcon(`sitting_yet.png`);
  //未在席アイコン（もうすぐ削除）
  const sittingYetDeleteSoonIcon = getNewIcon(`sitting_yet_delete_soon.png`);
  //固定席アイコン
  const sittingPermanentIcon = getNewIcon(sittingPermanentIconSrc, casheClearFlg);
  //追加席アイコン
  const sittingAddIcon = getNewIcon(`sitting_add.png`); 
  //自由席アイコン
  const sittingFreeIcon = getNewIcon(`sitting_free.png`); 
  //使用不可席アイコン
  const sittingUnavailableIcon = getNewIcon(`sitting_unavailble.png`); 

  const handleClickOpen = () => {
    setOpen(true);
  };
  /**dialogクローズイベント */
  const handleClose = () => {
    setOpen(false);

    if (refreshFlg) {
      props.getCurrentSeatList();
      setRefreshFlg(false);
    }

  };

  let popupRef = useRef();
  /**dialogオープンイベント */
  const dialogOpen = (titleText, ContextText, isSimpleDialog) => {
    setDialogTitleMessage(titleText);
    setDialogContentMessage(ContextText);
    const flg = (typeof (isSimpleDialog) === "undefined") ? true : false;
    setIsSimpleDialog(flg);
    handleClickOpen();
  }
  /**登録成功 */
  const InsertSuccsess = (unseatFlg) => {
    let _fromDate = fromDate;
    let _toDate = formatDateToString(toDate);
    let _userName = userName;
    let _popupText = userName;
    let _tmpDate = selectSeatDate;
    let _title = MESSAGE.DIALOG_SEAT_REGIST_TITLE;
    let _text = format(MESSAGE.DIALOG_SEAT_REGIST_DETAIL, userName, _fromDate, _toDate);
    if (permanentFlg) _text = format(MESSAGE.DIALOG_PERMANENT_SEAT_REGIST_DETAIL, userName);

    if (unseatFlg) {
      _userName = "";
      _popupText = MESSAGE.UNSEAT;
      _title = MESSAGE.DIALOG_UNSEAT_REGIST_TITLE;
      _text = format(MESSAGE.DIALOG_UNSEAT_REGIST_DETAIL, userName, _fromDate, _toDate);
      if (props.isPermanent) {
        _text = MESSAGE.DIALOG_UNSEAT_REGIST_DETAIL_PERMANENT;
      }
    } else {
      localStorage.setItem(LS_KEY, userName);
      if(isNullOrEmpty(imageData)){
        localStorage.removeItem(LS_KEY2);
      } else {
        localStorage.setItem(LS_KEY2, imageData);
      }
    }

    setUserName(_userName);
    setDefaultUserName(_userName);
    setPopupText(_popupText);
    setFromDate(formatDateToString(_tmpDate));
    setToDate(_tmpDate);
    dialogOpen(_title, _text);
    setUseSeatFlg(!unseatFlg);
    setRefreshFlg(true);
    setCommentListInit((prevCount) => prevCount + 1);
  }
  /**登録失敗 */
  const InsertFail = (message) => {
    console.log(message);
    setRefreshFlg(true);
    dialogOpen(MESSAGE.DIALOG_API_FAIL_TITLE, MESSAGE.DIALOG_API_FAIL_DETAIL);
  }
  /**登録失敗 */
  const InsertFailSeatUse = (message, useSeatList) => {
    console.log(message);

    let context = MESSAGE.DIALOG_API_FAIL_SEAT_USE + "\n";
    useSeatList.forEach(useSeat => {
      context = context + useSeat.seat_date + ":" + useSeat.user_name + "\n"
    });
    context = context.split('\n').map((item, idx) => {
      return (
        <div key={idx}>{item}</div>
      )
    });


    dialogOpen(MESSAGE.DIALOG_API_FAIL_TITLE, context);
  }
  /**座席使用確認 */
  const confirmSeatUse = (_fromDate, _toDate) => {
    return axios
      .post(API_URL.CONFIRM_SEAT_USE, {
        seat_id: seatId,
        from_date: _fromDate,
        to_date: _toDate
      })
      .then((response) => {
        if (response.status === 200) {
          return (response.data.length === 0) ? false : response.data;
        } else {
          return false;
        }

      })
      .catch((error) => {
        return false;
      });
  }
  /**座席登録ボタン押下イベント */
  const onClickSeatRegistButton = async () => {
    let _fromDate = fromDate;
    let _toDate = formatToDateAndValidDate();

    if (isNullOrEmpty(_toDate)) return;

    let _temp = (isNullOrEmpty(userName)) ? "" : userName;
    if (_temp.trim() === "") {
      dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_NAME_EMPTY);
      return;
    }

    currentUpdateMode = UpdateMode.update;

    const useSeatList = await confirmSeatUse(_fromDate, _toDate);
    if (useSeatList) {
      InsertFailSeatUse(MESSAGE.API_RESPONSE_UNEXPECT, useSeatList);
      return;
    }
    setIsLoading(true);
    axios
      .post(API_URL.INSERT, {
        seat_id: seatId,
        from_date: _fromDate,
        to_date: _toDate,
        user_name: userName,
        permanent_flg: permanentFlg,
        image_data: isNullOrEmpty(imageData)?null:imageData,
        comment: comment
      })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          InsertSuccsess(false);
        } else {
          InsertFail(MESSAGE.API_RESPONSE_UNEXPECT);
          return;
        }

      })
      .catch((error) => {
        setIsLoading(false);
        InsertFail(error.message);
        return;
      });
    props.map.closePopup();
  }
  /**日付バリデーション */
  const formatToDateAndValidDate = () => {
    let _fromDate = fromDate;
    let _toDate;

    try {
      _toDate = formatDateToString(toDate);

      let _tmpFDate = new Date(_fromDate);
      let _tmpTDate = new Date(_toDate);
      if (_tmpFDate.getTime() > _tmpTDate.getTime()) {
        dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_DATE_TERM_ILLEGAL);
        return null;
      }
    } catch (e) {
      console.log(e.message);
      dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_DATE_ILLEGAL);
      return null;
    }
    return _toDate;
  }

  /**座席空席登録ボタン押下イベント */
  const onClickUnSeatRegistButton = () => {
    dialogOpen(MESSAGE.DIALOG_UNSEAT_CONFIRM_TITLE, MESSAGE.DIALOG_UNSEAT_CONFIRM_DETAIL, false);
  }
  /**座席空席登録 */
  const unSeatRegist = () => {
    //空席登録
    currentUpdateMode = UpdateMode.unseat;

    let _selectedDate = formatDateToString(selectSeatDate);
    let _toDate = formatToDateAndValidDate();

    if (isNullOrEmpty(_toDate)) return;

    const sendData = {
      seat_id: seatId,
      seat_date: _selectedDate,
      to_date: _toDate,
      user_name: userName,
      used_name: (localStorage.getItem(LS_KEY)) ? localStorage.getItem(LS_KEY) : ""
    }
    setIsLoading(true);
    axios
      .delete(API_URL.DELETE, {
        data: sendData
      })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 204) {
          InsertSuccsess(true);
        } else {
          InsertFail(MESSAGE.API_RESPONSE_UNEXPECT);
          return;
        }

      })
      .catch((error) => {
        setIsLoading(false);
        InsertFail(error.message);
        return;
      });
    props.map.closePopup();
  };
  const userNameChange = (e) => {
    setUserName(e.target.value);
    if(isUnDesirableName(e.target.value)){
      setUserNameValid(MESSAGE.UNDESIRABLE_NAME);
      setUserNameConfirmFlg(false);
    } else {
      setUserNameValid("");
    }
  }
  //望ましくない名前かどうか判定
  const isUnDesirableName = (value) => {
    let result = false;
    const trimValue = value.trim();
    //2文字以下
    if(trimValue.length !== 0 && trimValue.length <= 2){
      result = true;
    }
    //漢字がない
    if(trimValue.length !== 0 && !trimValue.match(/\p{sc=Han}/u)){
      result = true;
    }
    //カタカナがある
    if(trimValue.match((/[ァ-ンー]+/))){
      result = true;
    }
    //カタカナがある
    if(trimValue.match((/[ｦ-ﾟ]+/))){
      result = true;
    }
    return result;
  }

  //望ましくない名前かどうか判定
  const IsRegistButtonDisabled = () => {
    let result = false;
    if(userNameValid !== ""){
      result = true;
      if(userNameConfirmFlg){
        result = false;
      }
    }

    
    return result;
  }
  const [userNameValid, setUserNameValid] = useState(!useSeatFlg && isUnDesirableName(userName)? MESSAGE.UNDESIRABLE_NAME : "");

  const toDateChange = (selectedDate) => {
    setToDate(selectedDate);
  }

  const handleChange = (e) => {
    setPermanentFlg(e.target.checked);
  }

  const userNameConfirmFlgChange = (e) => {
    setUserNameConfirmFlg(e.target.checked);
  }

  const commentChange = (e) => {
    setComment(e.target.value);
  }

  const replyChange = (e) => {
    setReplyComment(e.target.value);
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
      props.setPositionForSeatList(seatId, AfterPosition.lat, AfterPosition.lng);
    },
    //席クリック　削除するかはmarkerDeleteで判定
    click: (e) => {
      currentLat = e.latlng.lat;
      currentLng = e.latlng.lng;
      props.markerDelete(seatId);
      if (!props.admin) {
        //リプライ一覧を取得する
        getReplyList(true);
      }
    }
  }

  /**指定の座標に中心が移動する */
  const setViewCurrentLatlng = (_lat, _lng) => {
    const latlng = {
      "lat": _lat,
      "lng": _lng
    }
    currentLat = _lat;
    currentLng = _lng;
    setTimeout(function () {
      parentMap.setView(latlng, parentMap.getZoom());
    }, 10);
  }

  const map = useMapEvents({
    popupopen(e) {
      currentUpdateMode = UpdateMode.default;
      let _tmpDate = selectSeatDate;
      setFromDate(formatDateToString(_tmpDate));
      setToDate((availableDrawerOpen) ? availableToDate : _tmpDate);
      setImageData(localStorage.getItem(LS_KEY2));
      setIsPoppupOpen(true);
      setPermanentFlg(false);
      setUserNameConfirmFlg(false);
    },
    popupclose(e) {
      if (currentUpdateMode === UpdateMode.default) {
        setUserName(defaultUserName);
        let tmpDate = selectSeatDate;
        setFromDate(formatDateToString(tmpDate));
        setToDate(tmpDate);
        setUserNameValid(!useSeatFlg && isUnDesirableName(defaultUserName)? MESSAGE.UNDESIRABLE_NAME : "")
      } else {
        currentUpdateMode = UpdateMode.default;
      }
      setIsPoppupOpen(false);
    },
    zoomanim(e) {
      setZoom((map.getZoom() === 0 ? 1 : 0));
    }
  })

  const getIcon = () => {
    if (props.seatDate === "add") {
      return sittingAddIcon;
    }
    if (admin) {
      return sittingFreeIcon;
    }
    if (props.isPermanent) {
      return sittingPermanentIcon;
    }
    if (useSeatFlg) {
      if (!SITTING_ENABLE_FLG || sittingFlg) {
        return sittingIcon;
      } else {
        if(SITTING_CONFIRM_ENABLE_FLG && isDeleteSoonSeat()){
            return sittingYetDeleteSoonIcon;
        }
        return sittingYetIcon;
      }

    } else {
      if(availableDrawerOpen && !props.isAvailable){
        return sittingUnavailableIcon;
      }
      return sittingFreeIcon;
    }
  }
  /**アイコンのファイル選択時イベント */
  const onFileChange = async (e) => {
    const files = e.target.files
    if (files.length > 0) {
      const file = e.target.files[0];
      const image = await resizeFile(file);
      setImageData(image);
      setViewCurrentLatlng(currentLat + 100, currentLng);
    } else {
      setImageData(null);
    }
  }
  /**リサイズ処理 */
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
  /**カレンダーオープンボタン */
  const onClickCalendarButton = () => {
    setCalendarOpen(true);
    seatCalendarRef.current.onClickCalendarButton(seatId, fromDate);
  }
  /**カレンダークローズボタン */
  const calendarClose = () => {
    setCalendarOpen(false);
  }

  /**返信送信ボタン押下イベント */
  const onClickReplySendButton = () => {
    //バリデーションチェック
    if (isNullOrEmpty(replyComment) || replyComment.trim() === "") {
      dialogOpen(MESSAGE.DIALOG_VALID_FAIL_TITLE, MESSAGE.DIALOG_VALID_FAIL_DETAIL_REPLY_EMPTY);
      return;
    }
    setIsLoading(true);
    axios
      .post(API_URL.REPLY_INSERT, {
        seat_date: formatDateToString(selectSeatDate),
        seat_id: seatId,
        comment: replyComment
      })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          getReplyList(false);
          setReplyComment("");
          setCommentListInit((prevCount) => prevCount + 1);
          //コメントの吹き出しを即時反映させるためリスト更新
          const tmpSeatList = seatList.map(s => {
            if(s.seat_id === seatId) {
              s.comment_reply_count = s.comment_reply_count + 1;
            }
            return s;
          });
          setSeatList(tmpSeatList);
        } else {
          InsertFail(MESSAGE.API_RESPONSE_UNEXPECT);
          return;
        }

      })
      .catch((error) => {
        setIsLoading(false);
        InsertFail(error.message);
        return;
      });
  }

  /**リプライ一覧取得 */
  const getReplyList = (LatlngAdjustFlg) => {
    setReplyList([]);
    setIsLoading(true);
    axios
      .post(API_URL.REPLY_SELECT, {
        seat_date: formatDateToString(selectSeatDate),
        seat_id: seatId
      })
      .then((response) => {
        setIsLoading(false);
        setReplyList(response.data);
        if (LatlngAdjustFlg) {
          //ポップアップ表示位置の調整
          let _adjustLat = currentLat;

          if (!useSeatFlg) {
            _adjustLat = _adjustLat + 80;
          } else {
            if (!isNullOrEmpty(props.image)) {
              _adjustLat = _adjustLat + 90;
            }
            if (!isNullOrEmpty(props.registedComment)) {
              _adjustLat = _adjustLat + 60;
            }
            if (response.data.length === 1) {
              _adjustLat = _adjustLat + 60;
            }
            if (response.data.length >= 2) {
              _adjustLat = _adjustLat + 140;
            }
          }
          setViewCurrentLatlng(_adjustLat, currentLng);
        }
        //スクロールを一番下に
        if (response.data.length >= 2) {
          setTimeout(function () {
            const target = document.getElementById("replyListArea");
            target.scrollTop = target.scrollHeight;
          }, 100);
        }
      });
  }

  /**在席切替押下 */
  const onClickSittingButton = () => {
    const formartSelectSeatDate = formatDateToString(selectSeatDate);
    //当日でない場合切替不可
    if(formartSelectSeatDate !== formatDateToString(new Date())) return;
    setIsLoading(true);
    const updateSittingFlg = (sittingFlg === 1) ? 0 : 1;
    axios
      .post(API_URL.SITTING_FLG_UPDATE, {
        seat_date: formartSelectSeatDate,
        seat_id: seatId,
        sitting_flg: updateSittingFlg,
        used_name: (localStorage.getItem(LS_KEY)) ? localStorage.getItem(LS_KEY) : ""
      })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          setSittingFlg(updateSittingFlg);
        } else {
          InsertFail(MESSAGE.API_RESPONSE_UNEXPECT);
          return;
        }

      })
      .catch((error) => {
        setIsLoading(false);
        InsertFail(error.message);
        return;
      });
  }

  /**テスト用アイコン */
  const ShowTestIcon = () => {
    return <div></div>;
    return <div>
      <ChairAltIcon sx={{fontSize:"35px", color:"#930000"}} />
      <TextsmsOutlinedIcon sx={{fontSize:"20px"}} />
      <TextsmsOutlinedIcon sx={{fontSize:"20px", color:"#5cc3bb"}} />
      <PersonOffTwoToneIcon sx={{fontSize:"35px"}} / >
      <PersonOffTwoToneIcon sx={{fontSize:"35px", color:"#930000"}} / >
      <PersonOutlineTwoToneIcon sx={{fontSize:"35px", color:"#5cc3bb"}} / >
      <PersonOutlineTwoToneIcon sx={{fontSize:"35px", color:"#f2a986"}} / > 
    </div>;
  }

  const isPermanent = () => {
    return props.tooltipPermanent && (admin || useSeatFlg);
  }

  const clearImageData = () => {
    setImageData("");
    setViewCurrentLatlng(currentLat, currentLng);
  }

  return (
    <Marker ref={markerRef} draggable={admin} eventHandlers={eventHandlers} position={props.position} icon={getIcon()}>
      {zoom === 0 &&
        <Tooltip direction={tooltipDirection} permanent={isPermanent()}><b>{admin ? seatId : popupText}</b></Tooltip>
      }
      {zoom === 1 &&
        <Tooltip className="tooltip" direction={tooltipDirection} permanent={isPermanent()}><b>{admin ? seatId : popupText}</b></Tooltip>
      }
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
            <Grid container alignItems="center" rowSpacing={0.5} >
              <ShowTestIcon / >
              <Grid item xs={12}>
                {!useSeatFlg &&
                  <div>
                    <Button size="small" variant="contained" startIcon={<FaceRetouchingNaturalIcon />}
                      onClick={() => onClickfileUploadButton()}>
                      {MESSAGE.ICON_UPLOAD_BUTTON}
                    </Button>
                    <div className="image">
                      <input type="file" accept="image/*"
                        hidden ref={inputFileRef}
                        onChange={(e) => onFileChange(e)}
                      />
                      <div className={isNullOrEmpty(imageData)?unUseClassName:''}>
                        <CancelIcon className='icon-cancel' onClick={clearImageData} />
                        <Avatar src={imageData} alt="tmp_icon" sx={{ width: 100, height: 100 }} />
                      </div>
                    </div>
                  </div>
                }
                <div className={useSeatFlg ? "image" : unUseClassName}>
                  {!isNullOrEmpty(props.image) && (<Avatar src={props.image} alt="icon" sx={{ width: 100, height: 100 }} />)}
                </div>
              </Grid>
              <Grid item xs={10} sx={{height:"70px"}}>
                <TextField
                  disabled={useSeatFlg}
                  name="userName"
                  value={userName}
                  onChange={userNameChange}
                  label={MESSAGE.NAME}
                  variant="standard"
                  size="small"
                  helperText={userNameValid}
                />
              </Grid>
              <Grid item xs={2}>
                {(SITTING_ENABLE_FLG && useSeatFlg && !props.isPermanent) &&
                  <MaterialTooltip placement="right" title={MESSAGE.SITTING}>
                    <Button className="sitting-button" onClick={onClickSittingButton}>
                      {sittingFlg
                        ?
                        <PersonOutlineTwoToneIcon sx={{ fontSize: 35, color: "#5cc3bb" }} />
                        :
                        <PersonOffTwoToneIcon color="action" sx={{ fontSize: 35 }} />
                      }
                    </Button>
                  </MaterialTooltip>
                }
              </Grid>
              <Grid item xs={12}>
                {!useSeatFlg && userNameValid !== "" &&
                  <FormControlLabel 
                    control={
                      <Checkbox checked={userNameConfirmFlg} onChange={userNameConfirmFlgChange} size="small" />
                    } 
                    label={MESSAGE.USER_NAME_CONFIRM} 
                    sx={{
                      paddingLeft:"7px",
                      '& .MuiTypography-root': {
                        fontSize:"0.5rem",
                        color:"#d32f2f",
                        fontWeight:"bold"
                      }
                    }}
                  />
                }
              </Grid>
              {!useSeatFlg &&
                <Grid item xs={12}>
                  <div className='comment-area'>
                    <CommentTextField
                      isComment={true}
                      readOnly={false}
                      onChange={commentChange}
                    />
                  </div>
                </Grid>
              }
              <Grid item xs={12}>
                {(useSeatFlg && !isNullOrEmpty(props.registedComment)) &&
                  <div className='comment-area'>
                    <CommentTextField
                      isComment={true}
                      readOnly={true}
                      value={props.registedComment}
                    />
                  </div>
                }
                <div id="replyListArea" className='reply-list-area'>
                  {replyList.map((reply) => {
                    return (
                      <div className='reply-area' key={reply.key}>
                        <CommentTextField
                          isComment={false}
                          readOnly={true}
                          value={reply.comment}
                        />
                      </div>
                    );
                  })}
                </div>
                {useSeatFlg &&
                  <div className='reply-area'>
                    <CommentTextField
                      isComment={false}
                      readOnly={false}
                      value={replyComment}
                      onChange={replyChange}
                    />
                    <Button className="reply-send-button" onClick={() => onClickReplySendButton()}>
                      <AddCommentTwoToneIcon />
                    </Button>
                  </div>
                }
              </Grid>
              {(!useSeatFlg || !props.isPermanent) &&
                <Grid item xs={6}>
                  <input
                    className="date-input"
                    value={fromDate}
                    disabled={true}
                  />
                </Grid>
              }
              {(!useSeatFlg || !props.isPermanent) &&
                <Grid className="date-input-wave" item xs={1}>
                  ～
                </Grid>
              }
              {(!useSeatFlg || !props.isPermanent) &&
                <Grid item xs={5}>
                  <Datetime
                    locale='ja'
                    inputProps={{ "className": "date-input", "readOnly": "readOnly" }}
                    dateFormat={DATE_FORMAT}
                    timeFormat={false}
                    value={toDate}
                    initialValue={toDate}
                    closeOnSelect={true}
                    onChange={(selectedDate) => { toDateChange((selectedDate || Today)) }}
                  />
                </Grid>
              }
              <Grid item xs={12}>
                {!useSeatFlg &&
                  <MaterialTooltip placement="right" title={MESSAGE.PARMANENT_TOOLTIP_TITLE} open={permanentFlg && isPoppupOpen}>
                    <FormControlLabel required control={<Checkbox checked={permanentFlg} onChange={handleChange} size="small" />} label={MESSAGE.PARMANENT} />
                  </MaterialTooltip>
                }
              </Grid>
              <Grid item xs={8}>
                {!useSeatFlg
                  ?
                  <Button variant="outlined" disabled={IsRegistButtonDisabled()} startIcon={<ChairAltIcon />} onClick={() => onClickSeatRegistButton()}>{MESSAGE.SEAT_REGIST_BUTTON}</Button>
                  :
                  <MaterialTooltip placement="right" title={props.isPermanent ? "" : MESSAGE.UNSEAT_TOOLTIP_TITLE}>
                    <Button variant="outlined" disabled={(!props.isPermanent && sittingFlg === 1)} startIcon={<PersonRemoveIcon />} onClick={() => onClickUnSeatRegistButton()}>{MESSAGE.UNSEAT_REGIST_BUTTON}</Button>
                  </MaterialTooltip>
                }
              </Grid>
              <Grid item xs={4} sx={{ justifyContent: "center" }}>
                {!props.isPermanent &&
                  <MaterialTooltip placement="right" title={MESSAGE.SEAT_SCHEDULE_BUTTON}>
                    <Button className="" onClick={onClickCalendarButton}>
                      <CalendarMonthTwoToneIcon />
                    </Button>
                  </MaterialTooltip>
                }
              </Grid>
            </Grid>
          </Box>
        </Popup>
      }
      <LeafletDialog
        open={open}
        handleClose={handleClose}
        dialogTitleMessage={dialogTitleMessage}
        dialogContentMessage={dialogContentMessage}
        isSimpleDialog={isSimpleDialog}
        handleOk={unSeatRegist}
      />
      <SeatCalendar
        ref={seatCalendarRef}
        open={calendarOpen}
        handleClose={calendarClose}
        seatId={seatId}
        fromDate={fromDate}
        dateChangeYmd={props.dateChangeYmd}
      />
    </Marker>
  )
}

export default LeafletMarker;