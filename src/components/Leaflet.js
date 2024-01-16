import { LatLng,LatLngBounds,CRS } from 'leaflet';
import React, { useState,useImperativeHandle,forwardRef,useEffect  } from 'react'
import { MapContainer, TileLayer, ImageOverlay,useMapEvents, useMap } from 'react-leaflet';
import LeafletMarker from './LeafletMarker';
import axios from "axios";
import {API_URL, PERMANENT_DATE} from "./Const";
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Button,ButtonGroup } from "@mui/material";
import LeafletDialog from "./LeafletDialog";
import {formatDateToString} from "./FormatDate";

/** メッセージ */
const MESSAGE = {
  ADD: "追加",
  DIALOG_FAIL_TITLE: "APIエラー",
  DIALOG_FAIL_DETAIL: "登録に失敗しました。座席一覧を再読み込みします。",
  DIALOG_SUCCESS_TITLE: "座席位置登録",
  DIALOG_SUCCESS_DETAIL: "座席位置を登録しました。",
  API_RESPONSE_UNEXPECT:"APIのレスポンスが正常以外です",
}

/*
function LocationMarker() {
  const map = useMapEvents({
    click(e) {
      console.log(e.latlng)
    }
  })
}
*/
const LeafletMain = (props, ref) => {

  const [map, setMap] = useState();
  //App.jsから渡ってくるセレクトボックスの席日付
  const [seatDate, setSeatDate] = useState(props.seatDate);
  //オフィス画像の初期値
  const [floorMap, setFloorMap] = useState("office.png");
  //leafletの中心座標
  const centerLatLng = new LatLng(235, 400);
  //leafletの描画サイズ
  const bounds = new LatLngBounds([0, 0], [470, 835]);

  let tmpSeatList = [];
  //席一覧
  const [seatList, setSeatList] = useState(tmpSeatList);
  //Tooltipを常に表示するかどうかのフラグ 管理モードだと常に表示
  const [tooltipPermanent, setTooltipPermanent] = useState(true);
  //dialogをオープンするかのフラグ
  const [open, setOpen] = useState(false);
  //dialogのタイトルメッセージ
  const [dialogTitleMessage, setDialogTitleMessage] = useState("");
  //dialogのコンテントメッセージ
  const [dialogContentMessage, setDialogContentMessage] = useState("");
  //席情報等をリフレッシュするかのフラグ
  //dialogオープン→true、dialogクローズ→リフレッシュ後にfalse
  const [refreshFlg, setRefreshFlg] = useState(false);
  //削除モードかのフラグ　管理モードで席削除ボタンを押下で削除モード
  const [deleteMode, setDeleteMode] = useState(false);
  //席のアイコンのCSSクラス　削除モードだとCSSが変わる
  const [iconClass, setIconClass] = useState("");
  //追加した席のカウント　管理モードで席追加ボタンを押下で+1
  const [addSeatCount, setAddSeatCount] = useState(1);

  /** 席日付の取得　LeafletMarker.jsからの参照用 */
  const getselectedDate = () => {
    return seatDate;
  }

  /** 現在のセレクトボックスの値から席一覧を取得する　LeafletMarker.jsからも参照 */
  const getCurrentSeatList = () => {
    return getSeatList(props.getSeatDate(), props.getFloor());
  }

  /** 席一覧を取得する */
  const getSeatList = (date, floor) => {
    if(map !== undefined){
      map.closePopup();
    }
    setAddSeatCount(1);
    let _selectedDate = formatDateToString(date);
    setSeatDate(date);
    axios
      .post(API_URL.SELECT, {
        seat_date: _selectedDate,
        floor_id: floor
      })
      .then((response) => {
        setSeatList(response.data);
        setDeleteMode(false);
        setIconClass("");
        onClickMyLocationButton();
      });
  }
  /** センター位置ボタンクリックイベント　leafletをセンター位置、ズーム0に戻す */
  const onClickMyLocationButton = () => {
    if(map !== undefined){
      map.setView(centerLatLng, 0);
    }
  }
  /** 席のみ表示ボタンクリックイベント　tooltip表示を消して席のみ表示する */
  const onClickMyBadgeButton = () => {
    setTooltipPermanent(!tooltipPermanent);
    setSeatList([]);
    getCurrentSeatList();
  }
  /** 席削除ボタンクリックイベント　席アイコンを点滅状態にする */
  const onClickDeleteButton = () => {
    //削除モードでなければ点滅
    if(!deleteMode){
      setIconClass("blinking");
    }else{
      setIconClass("");
    }
    //削除モード開始or終了
    setDeleteMode(!deleteMode);
  }
  /** 席追加ボタンクリックイベント　追加アイコンを表示する */
  const onClickAddButton = () => {
    //削除モードなら何もしない
    if(deleteMode) return;
    let _temp = seatList;
    //let seat_id = Math.max(...temp.map(t => t.seat_id))+1;addSeatCount
    let _seat_id = MESSAGE.ADD + addSeatCount;
    //適当な座標に追加アイコン
    let addSeat = {
      key: _seat_id + "_add",
      seat_id: _seat_id,
      lat: 350,
      lng: 15,
      position: [350, 15],
      user_name: "",
      tooltip_direction: "",
      seat_date: "add"
    }
    //配列の最後に追加
    _temp = [...seatList, addSeat];
    setAddSeatCount(addSeatCount+1);
    setSeatList(_temp);
  }
  /** 席の位置座標セット　管理モードでドラッグが終了した時点の位置座標をセットする
   *  LeafletMarker.jsから参照される
   */
  const setPositionForSeatList = (seatId, lat, lng) => {
    let _temp = seatList;
    _temp.map((seat) => {
      if(seat.seat_id === seatId){
        seat.lat = lat;
        seat.lng = lng;
      }
    })
    setSeatList(_temp);
  }
  /** 席削除 */
  const markerDelete = (seatId) => {
    if(deleteMode){
      let _temp;
      //配列から指摘の席を削除
      _temp = seatList.filter(t => t.seat_id !== seatId);
      setSeatList(_temp);
    }
  }
  //読み込み時の処理
  useEffect(() =>{
      getSeatList(props.seatDate, props.floor);
  },[props.seatDate, props.floor])
  //呼び出し元からの参照
  useImperativeHandle(ref, () => ({
    /** App.jsで席日付が変更されたときに呼ばれる　席一覧を取得する */
    changeSeatList: (date, floor) => {
      getSeatList(date, floor);
    },
    /** App.jsでオフィスが変更されたときに呼ばれる　選択されたオフィス画像をセットする */
    setFloorMapFromParent: (floor_map) => {
      setFloorMap(floor_map);
    },
    /** App.jsで座席位置登録が押下されたときに呼ばれる　席情報を更新する */
    updateSeatLatLng: () => {
      handleClickOpen();
    }
  }))
  //dialogオープンイベント
  /** App.jsで座席位置登録が押下されたときに呼ばれる　席情報を更新する */
  const dialogOpen = (titleText, ContextText) => {
    setDialogTitleMessage(titleText);
    setDialogContentMessage(ContextText);
    setRefreshFlg(true);
    setOpen(true);
  }
  /** 登録失敗 */
  const InsertFail = (message) => {
    console.log(message);
    dialogOpen(MESSAGE.DIALOG_FAIL_TITLE, MESSAGE.DIALOG_FAIL_DETAIL);
  }
  /** 登録成功 */
  const InsertSuccess = () => {
    dialogOpen(MESSAGE.DIALOG_SUCCESS_TITLE, MESSAGE.DIALOG_SUCCESS_DETAIL);
  }
  /** 席情報を更新 */
  const handleClickOpen = () => {
    axios
      .post(API_URL.UPDATE, {
        floor_id: props.getFloor(),
        seat_list: seatList
      })
      .then((response) => {
        if(response.status === 200){
          InsertSuccess();
        }else{
          InsertFail(MESSAGE.API_RESPONSE_UNEXPECT);
          return;
        }
        
      })
      .catch((error) => {
        InsertFail(error.message);
        return;
      });
  };
  /**dialogクローズイベント */
  const handleClose = () => {
    setOpen(false);

    if(refreshFlg){
      setSeatList([]);
      getCurrentSeatList();
      setRefreshFlg(false);
    }

  };

  return (
    <MapContainer
      crs={CRS.Simple}
      center={centerLatLng}
      zoom={0}
      maxZoom={1}
      ref={m => {
        setMap(m);
      }}
    >
      <ButtonGroup
        orientation="vertical"
        aria-label="vertical contained button group"
        variant="contained"
        className="my-button-group"
      >
        <Button 
          variant="outlined" 
          size="small"
          className="my-button my-location-button"
          onClick={onClickMyLocationButton}>
            <MyLocationIcon className="my-icon" />
        </Button>
        {props.admin
          ?
            <Button 
              variant="outlined" 
              size="small"
              className="my-button my-badge-button"
              onClick={onClickAddButton}>
                <PersonAddAlt1Icon className="my-icon" />
            </Button>
          : 
            <Button 
              variant="outlined" 
              size="small"
              className="my-button my-badge-button"
              onClick={onClickMyBadgeButton}>
                <VisibilityOffIcon className="my-icon" />
            </Button>
        }
        {props.admin
          ?
            <Button 
              variant="outlined" 
              size="small"
              className="my-button my-badge-button"
              onClick={onClickDeleteButton}>
                <DeleteForeverIcon className="my-icon" />
            </Button>
          : ""
        }
      </ButtonGroup>
      <TileLayer
        attribution='&copy; <a href="https://github.com/nomura565/">written by Yusuke Nomura</a>'
        url=""
      />
      <ImageOverlay
        url={floorMap}
        bounds={bounds}
        zIndex={10}
      />
      {seatList.map((seat) => {
        return (
          <LeafletMarker
            map={map}
            key={seat.key}
            position={ seat.position}
            seatId={ seat.seat_id}
            userName={ seat.user_name}
            seatDate={ seat.seat_date}
            tooltipDirection={ seat.tooltip_direction}
            isPermanent={ (seat.seat_date === PERMANENT_DATE)? true:false}
            getSelectedDate={ getselectedDate}
            getCurrentSeatList={ getCurrentSeatList}
            tooltipPermanent={tooltipPermanent}
            admin={props.admin}
            setPositionForSeatList={setPositionForSeatList}
            iconClass={iconClass}
            markerDelete={markerDelete}
            image={(seat.image_data !== null)? seat.image_data: null}
            dateChangeYmd={props.dateChangeYmd}
            registedComment={seat.comment}
          />
        );
      })}
      <LeafletDialog
            open={open}
            handleClose={handleClose}
            dialogTitleMessage={dialogTitleMessage}
            dialogContentMessage={dialogContentMessage}
          />
    </MapContainer>
  )
}

export default forwardRef(LeafletMain);