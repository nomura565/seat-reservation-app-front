import {  format } from "date-fns";
import ja from 'date-fns/locale/ja';

export const BASE_URL = 'http://localhost:3000/api/seats/';

export const API_URL = {
    FLOOR: BASE_URL + "floor",
    SELECT: BASE_URL + "select",
    INSERT: BASE_URL + "insert",
    DELETE: BASE_URL + "delete",
  }

export const formatDate = (date) => {
  const d = new Date(date.toString());
  return format(
    d,
    "yyyy/MM/dd", {
    locale: ja,
  });
}