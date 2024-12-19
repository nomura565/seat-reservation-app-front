/** nullと空白文字の判定 */
export const isNullOrEmpty = (value) => {
  if(isNull(value)) {
    return true;
  }
  return (!value || !value.toString().match(/\S/g));
}

/** nullの判定 */
export const isNull = (value) => {
  return (typeof (value) === "undefined" || value === null);
}