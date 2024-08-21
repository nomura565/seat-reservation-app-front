import { LatLng, LatLngBounds, CRS } from 'leaflet';
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import LeafletMarker from './LeafletMarker';
import axios from "axios";
import { API_URL, PERMANENT_DATE, commentDrawerOpenAtom, commentListAtom, selectFloorAtom, selectSeatDateAtom, facilityScheduleOpenAtom, isLoadingAtom } from "./Const";
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Button, ButtonGroup } from "@mui/material";
import LeafletDialog from "./LeafletDialog";
import { formatDateToString } from "./FormatDate";
import ChatIcon from '@mui/icons-material/Chat';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt';
import LeafletMarkerFacility from './LeafletMarkerFacility';


/** メッセージ */
const MESSAGE = {
  ADD: "追加",
  DIALOG_FAIL_TITLE: "APIエラー",
  DIALOG_FAIL_DETAIL: "登録に失敗しました。座席一覧を再読み込みします。",
  DIALOG_SUCCESS_TITLE: "座席位置登録",
  DIALOG_SUCCESS_DETAIL: "座席位置を登録しました。",
  API_RESPONSE_UNEXPECT: "APIのレスポンスが正常以外です",
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
  //セレクトボックスの席日付
  const [selectSeatDate, setSelectSeatDate] = useAtom(selectSeatDateAtom);
  //オフィス画像の初期値
  const [floorMap, setFloorMap] = useState("office.png");
  //leafletの中心座標
  const defaultCenterLatLng = new LatLng(280, 400);
  const anotherCenterLatLng = new LatLng(320, 400);
  const [centerLatLng, setCenterLatLng] = useState(defaultCenterLatLng);
  //leafletの描画サイズ
  const defaultBounds = new LatLngBounds([0, 0], [558, 835]);
  const anotherBounds = new LatLngBounds([0, 0], [600, 735]);
  const [bounds, setBounds] = useState(defaultBounds);

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
  //コメントドロアーオープン
  const setCommentDrawerOpen = useSetAtom(commentDrawerOpenAtom);
  //コメントリスト
  const commentList = useAtomValue(commentListAtom);

  const selectFloor = useAtomValue(selectFloorAtom);

  const setIsLoading = useSetAtom(isLoadingAtom);

  /** 現在のセレクトボックスの値から席一覧を取得する　LeafletMarker.jsからも参照 */
  const getCurrentSeatList = () => {
    return getSeatList(selectSeatDate, selectFloor);
  }

  /** 席一覧を取得する */
  const getSeatList = (date, floor) => {
    setIsLoading(true);
    if (map !== undefined) {
      map.closePopup();
    }
    setAddSeatCount(1);
    let _selectedDate = formatDateToString(date);
    setSelectSeatDate(_selectedDate);
    axios
      .post(API_URL.SELECT, {
        seat_date: _selectedDate,
        floor_id: floor
      })
      .then((response) => {
        setIsLoading(false);
        setSeatList(response.data);
        setDeleteMode(false);
        setIconClass("");
        onClickMyLocationButton();
      });
  }
  /** センター位置ボタンクリックイベント　leafletをセンター位置、ズーム0に戻す */
  const onClickMyLocationButton = () => {
    if (map !== undefined) {
      map.setView(centerLatLng, 0);
    }
  }
  /** 席のみ表示ボタンクリックイベント　tooltip表示を消して席のみ表示する */
  const onClickMyBadgeButton = () => {
    setTooltipPermanent(!tooltipPermanent);
    setSeatList([]);
    getCurrentSeatList();
  }
  /** コメントボタンクリックイベント */
  const onClickCommentButton = () => {
    if(commentList.length > 0) setCommentDrawerOpen(true);
    
  }
  /** 席削除ボタンクリックイベント　席アイコンを点滅状態にする */
  const onClickDeleteButton = () => {
    //削除モードでなければ点滅
    if (!deleteMode) {
      setIconClass("blinking");
    } else {
      setIconClass("");
    }
    //削除モード開始or終了
    setDeleteMode(!deleteMode);
  }
  /** 席追加ボタンクリックイベント　追加アイコンを表示する */
  const onClickAddButton = () => {
    //削除モードなら何もしない
    if (deleteMode) return;
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
      seat_date: "add",
      facility_flg: 0,
      facility_id: null,
    }
    //配列の最後に追加
    _temp = [...seatList, addSeat];
    setAddSeatCount(addSeatCount + 1);
    setSeatList(_temp);
  }
  /** 席の位置座標セット　管理モードでドラッグが終了した時点の位置座標をセットする
   *  LeafletMarker.jsから参照される
   */
  const setPositionForSeatList = (seatId, lat, lng) => {
    let _temp = seatList;
    _temp.map((seat) => {
      if (seat.seat_id === seatId) {
        seat.lat = lat;
        seat.lng = lng;
      }
    })
    setSeatList(_temp);
  }
  /** 席削除 */
  const markerDelete = (seatId) => {
    if (deleteMode) {
      let _temp;
      //配列から指摘の席を削除
      _temp = seatList.filter(t => t.seat_id !== seatId);
      setSeatList(_temp);
    }
  }
  //読み込み時の処理
  useEffect(() => {
    getSeatList(selectSeatDate, selectFloor);
  }, [selectSeatDate, props.floor])
  //呼び出し元からの参照
  useImperativeHandle(ref, () => ({
    /** App.jsで席日付が変更されたときに呼ばれる　席一覧を取得する */
    changeSeatList: (date, floor) => {
      getSeatList(date, floor);
    },
    /** App.jsでオフィスが変更されたときに呼ばれる　選択されたオフィス画像をセットする */
    setFloorMapFromParent: (floor_map) => {
      setFloorMap(floor_map);
      //_vws(vertical writing style)がファイル名にあったら縦長
      if (floor_map.indexOf("_vws") !== -1) {
        //leafletの中心座標
        setCenterLatLng(anotherCenterLatLng);
        //leafletの描画サイズ
        setBounds(anotherBounds);
        
        setTimeout(function () {
          map.setView(anotherCenterLatLng, 0);
        }, 100);
      } else {
        //leafletの中心座標
        setCenterLatLng(defaultCenterLatLng);
        //leafletの描画サイズ
        setBounds(defaultBounds);

        setTimeout(function () {
          map.setView(defaultCenterLatLng, 0);
        }, 100);
        
      }
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
    setIsLoading(true);
    axios
      .post(API_URL.UPDATE, {
        floor_id: selectFloor,
        seat_list: seatList
      })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          InsertSuccess();
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
  };
  /**dialogクローズイベント */
  const handleClose = () => {
    setOpen(false);

    if (refreshFlg) {
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
          : 
          <Button
            variant="outlined"
            size="small"
            className="my-button my-badge-button"
            onClick={onClickCommentButton}>
            {commentList.length > 0
            ?
            <MarkUnreadChatAltIcon sx={{ color:"#44b700" }} className="my-icon rippleIcon" />
            :
            <ChatIcon className="my-icon" />
            }
            
          </Button>
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
        if(seat.facility_flg){
          return (
            <LeafletMarkerFacility
              map={map}
              key={seat.key}
              facilityId={seat.facility_id}
              seatId={seat.seat_id}
              tooltipDirection={seat.tooltip_direction}
              admin={props.admin}
              position={seat.position}
              iconClass={iconClass}
              setPositionForSeatList={setPositionForSeatList}
              markerDelete={markerDelete}
            />
          );
        } else {
          return (
            <LeafletMarker
              map={map}
              key={seat.key}
              position={seat.position}
              seatId={seat.seat_id}
              userName={seat.user_name}
              seatDate={seat.seat_date}
              tooltipDirection={seat.tooltip_direction}
              isPermanent={(seat.seat_date === PERMANENT_DATE) ? true : false}
              getCurrentSeatList={getCurrentSeatList}
              tooltipPermanent={tooltipPermanent}
              admin={props.admin}
              setPositionForSeatList={setPositionForSeatList}
              iconClass={iconClass}
              markerDelete={markerDelete}
              image={(seat.image_data !== null) ? seat.image_data : null}
              dateChangeYmd={props.dateChangeYmd}
              registedComment={seat.comment}
            />
          );
        }
      })}
      <LeafletDialog
        open={open}
        isSimpleDialog={true}
        handleClose={handleClose}
        dialogTitleMessage={dialogTitleMessage}
        dialogContentMessage={dialogContentMessage}
      />
    </MapContainer>
  )
}

export default forwardRef(LeafletMain);