import { atom } from 'jotai';
import { formatDateToString } from "./FormatDate";

export const commentDrawerOpenAtom = atom(false);
export const commentListAtom = atom([]);
export const selectSeatDateAtom = atom(formatDateToString(new Date()));
export const selectCommentSeatIdAtom = atom("");
export const selectFloorAtom = atom("1");
export const floorListAtom = atom([]);
export const commentListInitAtom = atom(0);
export const facilityScheduleOpenAtom = atom(false);
export const selectFacilityIdAtom = atom(null);
export const isLoadingAtom = atom(false);
export const existDeleteUsersAtom = atom(false);
export const zoomAtom = atom(0);
export const zoomTooltipClassAtom = atom("");
export const availableDrawerOpenAtom = atom(false);
export const seatListAtom = atom([]);
export const availableToDateAtom = atom(null);

export const DATE_FORMAT = "yyyy/MM/DD";
export const PERMANENT_DATE = "XXXX/XX/XX";
//在席管理機能を有効にするか
export const SITTING_ENABLE_FLG = true;
//在席自動削除機能を有効にするか
export const SITTING_CONFIRM_ENABLE_FLG = false;
//未在席の席を削除する時間
export const SITTING_CONFIRM_TIME = 1100;
//自動削除の警告が出る時間（-100で1時間前から警告）
export const SITTING_CONFIRM_ALERT_TIME = SITTING_CONFIRM_TIME-100;

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
  GAROON_SCHEDULE_SELECT: process.env.REACT_APP_BASE_URL + "garoonScheduleSelect",
  SITTING_FLG_UPDATE: process.env.REACT_APP_BASE_URL + "sittingFlgUpdate",
  SITTING_CONFIRM: process.env.REACT_APP_BASE_URL + "sittingConfirm",
  GET_UNAVAILABLE_SEAT_LIST: process.env.REACT_APP_BASE_URL + "getUnavailableSeatList",
}
