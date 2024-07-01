import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { useEffect } from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { API_URL, commentDrawerOpenAtom, seatDateAtom, commentListAtom, selectCommentSeatIdAtom } from "./Const";
import axios from "axios";
import Collapse from '@mui/material/Collapse';
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt';
import ReplyIcon from '@mui/icons-material/Reply';
import ChairAltIcon from '@mui/icons-material/ChairAlt';

/** メッセージ */
const MESSAGE = {
  WHOS_SEAT: "さんの席",
}

const CommentDrawer = (props) => {
  const [commentDrawerOpen, setCommentDrawerOpen] = useAtom(commentDrawerOpenAtom);
  const [commentList, setCommentList] = useAtom(commentListAtom);
  const seatDate = useAtomValue(seatDateAtom);
  const setSelectCommentSeatId = useSetAtom(selectCommentSeatIdAtom);

  useEffect(() => {
    commentSelect();
  }, [seatDate]);

  useEffect(() => {
    setSelectCommentSeatId("");
  }, [commentDrawerOpen]);

  /**コメント一覧取得 */
  const commentSelect = () => {
    setCommentList([]);
    return axios
      .post(API_URL.COMMENT_SELECT, {
        seat_date: seatDate
      })
      .then((response) => {
        if (response.status === 200) {
          setCommentList(response.data);
          return (response.data.length === 0) ? false : response.data;
        } else {
          return false;
        }

      })
      .catch((error) => {
        return false;
      });
  }

  const list = () => (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {commentList.map((comment, idx) => (
          <div>
          <ListItemButton key={comment.key} onClick={() =>setSelectCommentSeatId(comment.seat_id)}>
            <ListItemIcon>
              <ChairAltIcon />
            </ListItemIcon>
            <ListItemText primary={comment.user_name + MESSAGE.WHOS_SEAT} className='comment-drawer-text' />
          </ListItemButton>
          {comment.comment != null
          ?
          <ListItemButton key={comment.key}  sx={{ pl: 3 }}>
            <ListItemIcon>
              <MarkUnreadChatAltIcon />
            </ListItemIcon>
            <ListItemText primary={comment.comment} className='comment-drawer-text' />
          </ListItemButton>
          :
          ""
          }
          <Collapse in={true} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
          {comment.replys.map((reply, idx) => (
            <ListItemButton sx={{ pl: 5 }}>
              <ListItemIcon>
                <ReplyIcon />
              </ListItemIcon>
              <ListItemText primary={reply} className='comment-drawer-text'/>
            </ListItemButton>
            ))}
          </List>
        </Collapse>
        <Divider />
        </div>
        ))}
      </List>
    </Box>
  );

  return (
    <div>
      <Drawer open={commentDrawerOpen} onClose={() => setCommentDrawerOpen(false)}>
        {list()}
      </Drawer>
    </div>
  );
}

export default CommentDrawer;