import React from 'react'
import { TOOLTIP_DIRRECTION, seatListAtom } from "./Const";
import { useAtom } from 'jotai';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TextField, Tooltip } from "@mui/material";
import Checkbox from '@mui/material/Checkbox';

/** メッセージ */
const MESSAGE = {
  SEAT_ID: "シートID",
  SEAT_NAME: "シート名",
  SEAT_NAME_EXPLAINATION: "画面には表示されません。管理画面でのメモ用項目です。",
  TOOLTIP_DIRRECTION: "ツールチップの方向",
  FACILITY_FLG: "施設フラグ",
  FACILITY_FLG_EXPLAINATION: "フラグONの場合、通常の座席ではなく施設IDのガルーンの施設と連携します。",
  FACILITY_ID: "施設ID",
}

const SeatList = (props) => {
  //席一覧
  const [seatList, setSeatList] = useAtom(seatListAtom);

  /** tooltip変更イベント */
  const tooltipChange = (e, _seatId) => {
    const tmpSeatList = seatList.map(s => {
      if(s.seat_id === _seatId) {
        s.tooltip_direction = e.target.value;
      }
      return s;
    });
    setSeatList(tmpSeatList);
  }
  /** seatName変更イベント */
  const seatNameChange = (e, _seatId) => {
    const tmpSeatList = seatList.map(s => {
      if(s.seat_id === _seatId) {
        s.seat_name = e.target.value;
      }
      return s;
    });
    setSeatList(tmpSeatList);
  }
  /** facilityFlg変更イベント */
  const facilityFlgChange = (e, _seatId) => {
    const flg = e.target.checked ? 1 : 0;
    const tmpSeatList = seatList.map(s => {
      if(s.seat_id === _seatId) {
        s.facility_flg = flg;
      }
      return s;
    });
    setSeatList(tmpSeatList);
  }
  /** facilityId変更イベント */
  const facilityIdChange = (e, _seatId) => {
    const tmpSeatList = seatList.map(s => {
      if(s.seat_id === _seatId) {
        s.facility_id = e.target.value;
      }
      return s;
    });
    setSeatList(tmpSeatList);
  }
  return (
    <TableContainer component={Paper} className='admin-seat-list-table'>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>{MESSAGE.SEAT_ID}</TableCell>
            <Tooltip placement="bottom" title={MESSAGE.SEAT_NAME_EXPLAINATION}>
              <TableCell align="left">{MESSAGE.SEAT_NAME}</TableCell>
              </Tooltip>
            <TableCell align="left">{MESSAGE.TOOLTIP_DIRRECTION}</TableCell>
            <Tooltip placement="bottom" title={MESSAGE.FACILITY_FLG_EXPLAINATION}>
              <TableCell align="left">{MESSAGE.FACILITY_FLG}</TableCell>
              </Tooltip>
            <TableCell align="left">{MESSAGE.FACILITY_ID}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {seatList.map((seat) => (
            <TableRow
              key={seat.key}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {seat.seat_id}
              </TableCell>
              <TableCell align="right">
                <TextField
                  defaultValue={seat.seat_name}
                  onBlur={(e) => seatNameChange(e, seat.seat_id) }
                  variant="standard"
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Select
                    labelId="demo-simple-select-autowidth-label"
                    id="demo-simple-select-autowidth"
                    value={seat.tooltip_direction}
                    onChange={(e) => tooltipChange(e, seat.seat_id) }
                    sx={{width:"100px"}}
                  >
                    {TOOLTIP_DIRRECTION.map((val) => {
                      return (<MenuItem key={val} value={val}>
                        {val}
                      </MenuItem>)
                    })}
                  </Select>
                </TableCell>
              <TableCell align="right">
                <Checkbox
                  checked={seat.facility_flg === 1}
                  onChange={(e) => facilityFlgChange(e, seat.seat_id) }
                />
              </TableCell>
              <TableCell align="right">
                <TextField
                  disabled={seat.facility_flg !== 1}
                  defaultValue={seat.facility_id}
                  onBlur={(e) => facilityIdChange(e, seat.seat_id) }
                  variant="standard"
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
    </Table>
  </TableContainer>
  )
}

export default SeatList;