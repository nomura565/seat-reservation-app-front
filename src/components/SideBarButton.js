import React from 'react'
import { Button } from "@mui/material";

const SideBarButton = (props) => {
  const className = (props.isTop) ? "my-button my-location-button" : "my-button my-badge-button";
  return (
    <Button
      variant="outlined"
      size="small"
      className={className}
      onClick={props.onClick}>
      {props.icon}
    </Button>
  )
}

export default SideBarButton;