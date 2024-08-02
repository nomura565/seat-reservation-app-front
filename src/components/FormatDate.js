import { format, parse, parseISO } from "date-fns";
import ja from 'date-fns/locale/ja';

const DATE_FORMAT = "yyyy/MM/dd";
const YM_FORMAT = "yyyy/MM";

/** Date→yyyy/MM/ddの文字列に変換する */
export const formatDateToString = (date) => {
  const d = new Date(date.toString());
  return format(
    d,
    DATE_FORMAT, {
    locale: ja,
  });
}
/** Date→yyyy/MMの文字列に変換する */
export const formatDateToYM = (date) => {
  const d = new Date(date.toString());
  return format(
    d,
    YM_FORMAT, {
    locale: ja,
  });
}
/** 文字列→yyyy/MMのDateに変換する */
export const parseStringToYM = (stringDate) => {
  const d = parseStringToDate(stringDate);
  return formatDateToYM(d);
}
/** 文字列→yyyy/MM/ddのDateに変換する */
export const parseStringToDate = (stringDate) => {
  return parse(stringDate, DATE_FORMAT, new Date());
}
/** 文字列→ISODateに変換する */
export const parseStringToISODate = (stringDate) => {
  return parseISO(stringDate);
}
/** 文字列→9時固定のDateに変換する */
export const parseStringToNineHours = (stringDate) => {
  return parse(stringDate + " 09:00:00", 'yyyy/MM/dd HH:mm:ss', new Date());
}

/** 文字列→日を加算したyyyy/MM/ddの文字列に変換する */
export const addDayStringDateToString = (stringDate, addDay) => {
  let dt = parseStringToDate(stringDate);
  dt.setDate(dt.getDate() + addDay);
  return formatDateToString(dt);
}

/** 文字列→日を加算したyyyy/MM/ddのDateに変換する */
export const addDayStringDateToDate = (stringDate, addDay) => {
  let dt = parseStringToDate(stringDate);
  dt.setDate(dt.getDate() + addDay);
  return dt;
}

/** 文字列→時間を加算したyyyy/MM/ddの文字列に変換する */
export const addHourStringDateToString = (stringDate, addHour) => {
  let dt = parseStringToDate(stringDate);
  dt.setHours(dt.getHours() + addHour);
  return formatDateToString(dt);
}

/** 文字列→時間を加算したyyyy/MM/ddのDateに変換する */
export const addHourStringDateToDate = (stringDate, addHour) => {
  let dt = parseStringToDate(stringDate);
  dt.setHours(dt.getHours() + addHour);
  return dt;
}

/** 文字列→月を加算したyyyy/MM/ddのDateに変換する */
export const addMonthStringDateToDate = (stringDate, addMonth) => {
  let dt = parseStringToDate(stringDate);
  dt.setMonth(dt.getMonth() + addMonth);
  return dt;
}