import { icon } from 'leaflet';
import React, { useState, useEffect, useRef } from 'react';
import { Marker, Tooltip, useMapEvents } from 'react-leaflet';
import { API_URL, zoomAtom, selectSeatDateAtom, facilityScheduleOpenAtom, selectFacilityIdAtom
  , selectFloorAtom, isLoadingAtom } from "./Const";
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import "react-datetime/css/react-datetime.css";

import axios from "axios";
/** メッセージ */
const MESSAGE = {
  NOW_MEETING: "で使用中",
  NO_MEETING: "空室",
}

const LeafletMarkerFacility = (props) => {
  const setSelectFacilityId = useSetAtom(selectFacilityIdAtom);
  const setFacilityScheduleOpen = useSetAtom(facilityScheduleOpenAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);
  const selectSeatDate = useAtomValue(selectSeatDateAtom);
  const selectFloor = useAtomValue(selectFloorAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  //席の位置座標
  const [position, setPosition] = useState(props.position);
  //席ID
  const [seatId] = useState(props.seatId);
  const [facilityId] = useState(props.facilityId);
  //使用中アイコン
  let iconClass = props.iconClass;
  const markerRef = useRef(null);

  //自由席アイコン
  const freeIcon = new icon({
    iconUrl: 'facility2.png',
    iconSize: [48 + zoom * 10, 34 + zoom * 10], // size of the icon
    className: iconClass
  });

  //toolipで使う名前
  const [popupText, setPopupText] = useState(MESSAGE.NO_MEETING);

  //tooltipの表示向き　指摘がなければauto
  let tooltip_direction = props.tooltipDirection;
  if (tooltip_direction == null) {
    tooltip_direction = "auto";
  }
  const [tooltipDirection] = useState(tooltip_direction);
  //管理モードかのフラグ
  const [admin] = useState(props.admin);

  useEffect(() => {
    if (!admin) {
      getGaroonScheduleList();
    }
  }, [selectSeatDate, selectFloor])

  /** カレンダー一覧を取得する。 */
  const getGaroonScheduleList = () => {
    setIsLoading(true);
    let dt = new Date();
    const rangeStart = dt.toISOString();
    dt.setMinutes(dt.getMinutes() + 1);
    const rangeEnd = dt.toISOString();

    return axios
      .post(API_URL.GAROON_SCHEDULE_SELECT, {
        range_start: rangeStart,
        range_end: rangeEnd,
        facility_id: facilityId
      })
      .then((response) => {
        setIsLoading(false);
        if (response.status === 200) {
          setPopupText(`${response.data.events[0].subject} ${MESSAGE.NOW_MEETING}`);
        } else {
          setPopupText(MESSAGE.NO_MEETING);
          return false;
        }
      })
      .catch((error) => {
        setIsLoading(false);
        return false;
      });
  }

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
    click: (e) => {
      props.markerDelete(seatId);
      if (!admin) {
        setSelectFacilityId(props.facilityId);
        setFacilityScheduleOpen(true);
      }
    }
  }

  const map = useMapEvents({
    zoomanim(e) {
      setZoom((map.getZoom() === 0 ? 1 : 0));
    }
  })

  const getIcon = () => {
    return freeIcon;
  }

  return (
    <Marker ref={markerRef} draggable={admin} eventHandlers={eventHandlers} position={props.position} icon={getIcon()}>
      {zoom === 0 &&
        <Tooltip direction={tooltipDirection} permanent={true}><b>{admin ? seatId : popupText}</b></Tooltip>
      }
      {zoom === 1 &&
        <Tooltip className="tooltip" direction={tooltipDirection} permanent={true}><b>{admin ? seatId : popupText}</b></Tooltip>
      }
      
    </Marker>
  )
}

export default LeafletMarkerFacility;