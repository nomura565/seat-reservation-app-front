import { atom } from 'jotai';
import { formatDateToString } from "./FormatDate";

export const commentDrawerOpenAtom = atom(false);
export const commentListAtom = atom([]);
export const selectSeatDateAtom = atom(formatDateToString(new Date()));
export const selectCommentSeatIdAtom = atom("");
export const selectFloorAtom = atom("1");
export const floorListAtom = atom([]);
export const commentListInitAtom = atom(0);

export const DATE_FORMAT = "yyyy/MM/DD";
export const PERMANENT_DATE = "XXXX/XX/XX";

export const API_URL = {
  FLOOR: process.env.REACT_APP_BASE_URL + "floor",
  SELECT: process.env.REACT_APP_BASE_URL + "select",
  INSERT: process.env.REACT_APP_BASE_URL + "insert",
  DELETE: process.env.REACT_APP_BASE_URL + "delete",
  UPDATE: process.env.REACT_APP_BASE_URL + "update",
  CALENDAR: process.env.REACT_APP_BASE_URL + "calendar",
  REPLY_SELECT: process.env.REACT_APP_BASE_URL + "replySelect",
  REPLY_INSERT: process.env.REACT_APP_BASE_URL + "replyInsert",
  CONFIRM_SEAT_USE: process.env.REACT_APP_BASE_URL + "confirmSeatUse",
  COMMENT_SELECT: process.env.REACT_APP_BASE_URL + "commentSelect",
}
