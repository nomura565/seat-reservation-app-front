import { icon } from 'leaflet';
import React, { useRef } from 'react';
import { Marker} from 'react-leaflet';
import "react-datetime/css/react-datetime.css";
import { getDateStringForChache } from "./FormatDate";
import { zoomAtom } from "./Const";
import { useAtomValue } from 'jotai';

const LeafletMarkerComment = (props) => {
  const adjustPosition = [props.position[0]+ 25, props.position[1] + 15];

  const zoom = useAtomValue(zoomAtom);

  const getNewIcon = (iconUrl) => {
    let iconClass = props.iconClass;
    return new icon({
    iconUrl: `${iconUrl}?${getDateStringForChache()}`,
    iconSize: [25 + zoom * 10, 25 + zoom * 10], // size of the icon
    className: iconClass
    });
  }

  const commentIcon = getNewIcon(`comment.png`);

  const markerRef = useRef(null);

  const getIcon = () => {
    return commentIcon;
  }

  return (
    <Marker ref={markerRef} draggable={false} position={adjustPosition} icon={getIcon()}>
    </Marker>
  )
}

export default LeafletMarkerComment;