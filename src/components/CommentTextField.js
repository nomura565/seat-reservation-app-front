import React from 'react'
import { TextField } from "@mui/material";

const CommentTextField = (props) => {
  const label = (props.isComment === true) ? "comment" : "reply";
  const variant = (props.readOnly === true) ? "filled" : "standard";

  return (
    <TextField
      size="small"
      label={label}
      variant={variant}
      multiline
      className='comment-text'
      value={props.value}
      maxRows={2}
      onChange={props.onChange}
    />
  )
}

export default CommentTextField;