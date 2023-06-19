import { LatLng,LatLngBounds,CRS } from 'leaflet';
import React, { useState,useImperativeHandle,forwardRef,useEffect  } from 'react'
import { MapContainer, TileLayer, ImageOverlay,useMapEvents, useMap } from 'react-leaflet';
import LeafletMarker from './LeafletMarker';
import axios from "axios";
import {API_URL, formatDate} from "./Const";
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button,ButtonGroup } from "@mui/material";


function LocationMarker() {
  //onst [position, setPosition] = useState(null)
  const map = useMapEvents({
    click(e) {
      console.log(e.latlng)
    }
  })
}
const LeafletMain = (props, ref) => {

  const getselectedDate = () => {
    return seatDate;
  }

  const getCurrentSeatList = () => {
    //console.log("props.getCurrentSeatList");
    return getSeatList(props.getSeatDate(), props.getFloor());
  }

  const getSeatList = (date, floor) => {
    let selectedDate = formatDate(date);
    setSeatDate(date);
    //console.log(floor);
    axios
      .post(API_URL.SELECT, {
        seat_date: selectedDate,
        floor_id: floor
      })
      .then((response) => {
        //console.log(response.data);
        setSeatList(response.data);
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

  useEffect(() =>{
      getSeatList(props.seatDate, props.floor);
  },[props.seatDate, props.floor])

  const [map, setMap] = useState();
  const [seatDate, setSeatDate] = useState(props.seatDate);
  const [floorMap, setFloorMap] = useState("office.png");
  const centerLatLng = new LatLng(235, 400);

  useImperativeHandle(ref, () => ({
    changeSeatList: (date, floor) => {
      getSeatList(date, floor);
    },
    setFloorMapFromParent: (floor_map) => {
      setFloorMap(floor_map);
    }
  }))
  const bounds = new LatLngBounds([0, 0], [470, 835]);

  let tmpSeatList = [];
  const [seatList, setSeatList] = useState(tmpSeatList);
  const [tooltipPermanent, setTooltipPermanent] = useState(true);

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
        <Button 
          variant="outlined" 
          size="small"
          className="my-button my-badge-button"
          onClick={onClickMyBadgeButton}>
            <VisibilityOffIcon className="my-icon" />
        </Button>
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
            props={{
              key: seat.key,
              position: seat.position,
              seatId: seat.seat_id,
              userName: seat.user_name,
              tooltip_direction: seat.tooltip_direction,
              isPermanent: (seat.seat_date === "XXXX/XX/XX")? true:false,
              getSelectedDate: getselectedDate,
              getCurrentSeatList: getCurrentSeatList,
              tooltipPermanent:tooltipPermanent
            }}

          />
        );
      })}
      <LocationMarker />
    </MapContainer>

  )
}

export default forwardRef(LeafletMain);