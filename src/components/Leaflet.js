import { LatLng,LatLngBounds,CRS } from 'leaflet';
import React, { useState,useImperativeHandle,forwardRef,useEffect  } from 'react'
import { MapContainer, TileLayer, ImageOverlay,useMapEvents } from 'react-leaflet';
import LeafletMarker from './LeafletMarker';
import axios from "axios";
import {API_URL, formatDate} from "./Const";

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
      });
  }

  useEffect(() =>{
      getSeatList(props.seatDate, props.floor);
  },[props.seatDate, props.floor])

  const [map, setMap] = useState();
  const [seatDate, setSeatDate] = useState(props.seatDate);
  const [floorMap, setFloorMap] = useState("office.png");

  useImperativeHandle(ref, () => ({
    changeSeatList: (date, floor) => {
      getSeatList(date, floor);
    },
    setFloorMapFromParent: (floor_map) => {
      setFloorMap(floor_map);
    }
  }))
  const bounds = new LatLngBounds([0, 0], [360, 640]);

  let tmpSeatList = [];
  const [seatList, setSeatList] = useState(tmpSeatList);

  return (
    <MapContainer
      crs={CRS.Simple}
      center={new LatLng(170, 300)}
      zoom={0}
      maxZoom={1}
      ref={m => {
        //console.log(m);
        setMap(m);
      }}
    >
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
              isPermanent: (seat.seat_date === "XXXX/XX/XX")? true:false,
              getSelectedDate: getselectedDate,
              getCurrentSeatList: getCurrentSeatList
            }}

          />
        );
      })}
      <LocationMarker />
    </MapContainer>

  )
}

export default forwardRef(LeafletMain);