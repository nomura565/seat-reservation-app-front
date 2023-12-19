import {  format } from "date-fns";
import ja from 'date-fns/locale/ja';

export const BASE_URL = 'http://localhost:3000/api/seats/';
export const DATE_FORMAT = "yyyy/MM/DD";

export const API_URL = {
    FLOOR: BASE_URL + "floor",
    SELECT: BASE_URL + "select",
    INSERT: BASE_URL + "insert",
    DELETE: BASE_URL + "delete",
    UPDATE: BASE_URL + "update",
  }

export const formatDate = (date) => {
  const d = new Date(date.toString());
  return format(
    d,
    "yyyy/MM/dd", {
    locale: ja,
  });
}