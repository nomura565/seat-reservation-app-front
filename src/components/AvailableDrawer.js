import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { API_URL, DATE_FORMAT, availableDrawerOpenAtom, selectSeatDateAtom
  , selectFloorAtom, seatListAtom, availableToDateAtom } from "./Const";
  import { formatDateToString } from "./FormatDate";
import axios from "axios";
import Grid from '@mui/material/Grid';
import Datetime from 'react-datetime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import Typography from '@mui/material/Typography';
import "react-datetime/css/react-datetime.css";

/** メッセージ */
const MESSAGE = {
  TITLE: "空席期間検索",
}

const AvailableDrawer = (props) => {
  const [availableDrawerOpen, setAvailableDrawerOpen] = useAtom(availableDrawerOpenAtom);
  const selectSeatDate = useAtomValue(selectSeatDateAtom);
  const selectFloor = useAtomValue(selectFloorAtom);
  const [availableToDate, setAvailableToDate] = useAtom(availableToDateAtom);
  const [seatList, setSeatList] = useAtom(seatListAtom);

  useEffect(() => {
    if(availableDrawerOpen){
      getUnavailableSeatList();
    }
  }, [availableDrawerOpen, availableToDate]);

  /**利用不可席一覧取得 */
  const getUnavailableSeatList = () => {
    return axios
      .post(API_URL.GET_UNAVAILABLE_SEAT_LIST, {
        from_date: selectSeatDate,
        to_date: availableToDate,
        floor_id: selectFloor
      })
      .then((response) => {
        if (response.status === 200) {
          let tmpSeatList = [];
          seatList.forEach(seat => {
            let resSeat = response.data.filter(res => res.seat_id === seat.seat_id);
            if(resSeat.length > 0 ){
              seat.is_available = false;
            } else {
              seat.is_available = true;
            }
            tmpSeatList.push(seat);
          });

          setSeatList(tmpSeatList);

        } else {
          return false;
        }

      })
      .catch((error) => {
        return false;
      });
  }

  /**日付バリデーション */
  const ValidDate = (_toDate) => {
    let _stringToDate;

    try {
      _stringToDate = formatDateToString(_toDate);

      let _tmpFDate = new Date(selectSeatDate);
      let _tmpTDate = new Date(_stringToDate);
      if (_tmpFDate.getTime() > _tmpTDate.getTime()) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  const dateChange = (_toDate) => {
    if(ValidDate(_toDate)){
      let date = formatDateToString(_toDate);
      setAvailableToDate(date);
    } else {
      setAvailableToDate(selectSeatDate);
    }
  }

  return (
    <div>
      <Drawer open={availableDrawerOpen} 
        variant={"persistent"}
        anchor={"bottom"}
        onClose={() => setAvailableDrawerOpen(false)}>
        <Box sx={{ height: 340 }} role="presentation">
          <Grid container alignItems="center" rowSpacing={0.5} >
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
              <DateRangeIcon />{MESSAGE.TITLE}
              </Typography>
            </Grid>
            <Grid item xs={1} sx={{display: "flex", justifyContent:"center"}}>
              <input
                className="date-input"
                value={selectSeatDate}
                disabled={true}
              />
            </Grid>
            <Grid item xs={0.5} sx={{display: "flex", justifyContent:"center"}}>
              ～
            </Grid>
            <Grid item xs={1} sx={{display: "flex", justifyContent:"center"}}>
              <Datetime
                locale='ja'
                inputProps={
                  {
                    "className": "date-input",
                    "readOnly": "readOnly"
                  }
                }
                dateFormat={DATE_FORMAT}
                timeFormat={false}
                value={availableToDate}
                initialValue={(availableToDate === null) ? selectSeatDate : availableToDate}
                closeOnSelect={true}
                onChange={selectedDate => { dateChange(selectedDate) }}
              />
            </Grid>
            <Grid item xs={10.5}></Grid>
          </Grid>
        </Box>
      </Drawer>
    </div>
  );
}

export default AvailableDrawer;