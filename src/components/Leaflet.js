import { LatLng,LatLngBounds,CRS } from 'leaflet';
import React, { useState,useImperativeHandle,forwardRef,useEffect  } from 'react'
import { MapContainer, TileLayer, ImageOverlay,useMapEvents, useMap } from 'react-leaflet';
import LeafletMarker from './LeafletMarker';
import axios from "axios";
import {API_URL, formatDate} from "./Const";
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Button,ButtonGroup } from "@mui/material";
import LeafletDialog from "./LeafletDialog";


function LocationMarker() {
  //onst [position, setPosition] = useState(null)
  const map = useMapEvents({
    click(e) {
      console.log(e.latlng)
    }
  })
}
const LeafletMain = (props, ref) => {

  const [map, setMap] = useState();
  const [seatDate, setSeatDate] = useState(props.seatDate);
  const [floorMap, setFloorMap] = useState("office.png");
  const centerLatLng = new LatLng(235, 400);
  const bounds = new LatLngBounds([0, 0], [470, 835]);

  let tmpSeatList = [];
  const [seatList, setSeatList] = useState(tmpSeatList);
  const [tooltipPermanent, setTooltipPermanent] = useState(true);
  const [open, setOpen] = useState(false);
  const [dialogTitleMessage, setDialogTitleMessage] = useState("");
  const [dialogContentMessage, setDialogContentMessage] = useState("");
  const [refreshFlg, setRefreshFlg] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [iconClass, setIconClass] = useState("");
  const [addSeatCount, setAddSeatCount] = useState(1);

  const getselectedDate = () => {
    return seatDate;
  }

  const getCurrentSeatList = () => {
    //console.log("props.getCurrentSeatList");
    return getSeatList(props.getSeatDate(), props.getFloor());
  }

  const getSeatList = (date, floor) => {
    setAddSeatCount(1);
    let selectedDate = formatDate(date);
    setSeatDate(date);
    //console.log(floor);
    axios
      .post(API_URL.SELECT, {
        seat_date: selectedDate,
        floor_id: floor
      })
      .then((response) => {
        console.log(response.data);
        setSeatList(response.data);
        setDeleteMode(false);
        setIconClass("");
        onClickMyLocationButton();
      });
  }

  const onClickMyLocationButton = () => {
    if(map !== undefined){
      map.setView(centerLatLng, map.getZoom());
    }
  }
  
  const onClickMyBadgeButton = () => {
    setTooltipPermanent(!tooltipPermanent);
    setSeatList([]);
    getCurrentSeatList();
  }

  const onClickDeleteButton = () => {
    if(!deleteMode){
      setIconClass("blinking");
    }else{
      setIconClass("");
    }
    setDeleteMode(!deleteMode);
  }

  const onClickAddButton = () => {
    if(deleteMode) return;
    let temp = seatList;
    //let seat_id = Math.max(...temp.map(t => t.seat_id))+1;addSeatCount
    let seat_id = "追加"+ addSeatCount;
    let addSeat = {
      key: seat_id + "_add",
      seat_id: seat_id,
      lat: 350,
      lng: 15,
      position: [350, 15],
      user_name: "",
      tooltip_direction: "",
      seat_date: "add"
    }
    temp = [...seatList, addSeat];
    setAddSeatCount(addSeatCount+1);
    setSeatList(temp);
  }

  const setPositionForSeatList = (seatId, lat, lng) => {
    let temp = seatList;
    temp.map((seat) => {
      if(seat.seat_id === seatId){
        seat.lat = lat;
        seat.lng = lng;
      }
    })
    setSeatList(temp);
  }

  const markerDelete = (seatId) => {
    if(deleteMode){
      let temp;
      temp = seatList.filter(t => t.seat_id !== seatId);
      setSeatList(temp);
    }
  }

  useEffect(() =>{
      getSeatList(props.seatDate, props.floor);
  },[props.seatDate, props.floor])

  useImperativeHandle(ref, () => ({
    changeSeatList: (date, floor) => {
      getSeatList(date, floor);
    },
    setFloorMapFromParent: (floor_map) => {
      setFloorMap(floor_map);
    }
    ,
    updateSeatLatLng: () => {
      handleClickOpen();
    }
  }))

  const dialogOpen = (titleText, ContextText) => {
    setDialogTitleMessage(titleText);
    setDialogContentMessage(ContextText);
    setRefreshFlg(true);
    setOpen(true);
  }
  
  const InsertFail = () => {
    dialogOpen("APIエラー", "登録に失敗しました。座席一覧を再読み込みします。");
  }

  const InsertSuccess = () => {
    dialogOpen("座席位置登録", "座席位置を登録しました。");
  }

  const handleClickOpen = () => {
    //console.log(seatList);
    axios
      .post(API_URL.UPDATE, {
        floor_id: props.getFloor(),
        seat_list: seatList
      })
      .then((response) => {
        //console.log(response);
        if(response.status === 200){
          InsertSuccess();
        }else{
          InsertFail();
          return;
        }
        
      })
      .catch((response) => {
        //console.log(response);
        InsertFail();
        return;
      });
  };

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
        //console.log(m);
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
            tooltip_direction={ seat.tooltip_direction}
            isPermanent={ (seat.seat_date === "XXXX/XX/XX")? true:false}
            getSelectedDate={ getselectedDate}
            getCurrentSeatList={ getCurrentSeatList}
            tooltipPermanent={tooltipPermanent}
            admin={props.admin}
            setPositionForSeatList={setPositionForSeatList}
            iconClass={iconClass}
            markerDelete={markerDelete}
            image={(seat.image_data !== null)? seat.image_data: null}
          />
        );
      })}
      <LocationMarker />
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