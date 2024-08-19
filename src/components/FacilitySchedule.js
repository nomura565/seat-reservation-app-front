import React, { useState, useEffect, useCallback } from 'react'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { Button, ButtonGroup } from "@mui/material";
import { API_URL, facilityScheduleOpenAtom, selectSeatDateAtom, selectFacilityIdAtom, isLoadingAtom } from "./Const";
import axios from "axios";
import { formatDateToString, parseStringToDate, parseStringToISODate, addDayStringDateToDate, parseStringToNineHours } from "./FormatDate";
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import "react-big-calendar/lib/css/react-big-calendar.css";
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

// Setup the localizer by providing the moment (or globalize, or Luxon) Object
// to the correct localizer.
const localizer = momentLocalizer(moment) // or globalizeLocalizer

/** メッセージ */
const MESSAGE = {
  FACILITY_REGIST_BUTTON: "この部屋を予約する",
  ATTENDEES: "参加者：",
  ATTENDEES_OTHER: "…他",
}

const FacilitySchedule = (props) => {
  const selectSeatDate = useAtomValue(selectSeatDateAtom);
  const selectFacilityId = useAtomValue(selectFacilityIdAtom);
  const [facilityScheduleOpen, setFacilityScheduleOpen] = useAtom(facilityScheduleOpenAtom);
  const setIsLoading = useSetAtom(isLoadingAtom);
  const [view, setView] = useState("day");
  const onView = useCallback((newView) => setView(newView), [setView]);
  //席ID
  let tmpScheduleList = [];
  const [scheduleList, setScheduleList] = useState(tmpScheduleList);

  const handleClose = () => {
    setFacilityScheduleOpen(false);
  }
  //予約ボタン押下時
  const onClickFacilityRegistButton = () => {
    window.open(`${process.env.REACT_APP_GAROON_URL}schedule/add?uid=f${selectFacilityId}`, '_blank');
  }
  //セレクト時コールバック
  const onSelectSlot = useCallback((slotInfo) => {
    console.log(slotInfo);
  }, [selectFacilityId]);
  //日付変更時コールバック
  const onNavigate = useCallback((newDate) => {
    getGaroonScheduleList(formatDateToString(newDate));
  }, [selectFacilityId]);
  //イベントセレクト時コールバック
  const onSelectEvent = useCallback((calEvent) => {
    window.open(`${process.env.REACT_APP_GAROON_URL}schedule/view?event=${calEvent.event_id}`, '_blank');
  }, [selectFacilityId]);

  useEffect(() => {
    if(facilityScheduleOpen){
      getGaroonScheduleList(selectSeatDate);
    }
  }, [facilityScheduleOpen])

  /** カレンダー一覧を取得する。 */
  const getGaroonScheduleList = (_fromDate) => {
    setIsLoading(true);
    setScheduleList([]);

    const rangeStart = parseStringToDate(_fromDate).toISOString();
    const rangeEnd  = addDayStringDateToDate(_fromDate, 1).toISOString();

    return axios
    .post(API_URL.GAROON_SCHEDULE_SELECT, {
      range_start: rangeStart,
      range_end: rangeEnd,
      facility_id:selectFacilityId
    })
    .then((response) => {
      setIsLoading(false);
      if (response.status === 200) {
        makeScheduleList(response.data);
      } else {
        return false;
      }
    })
    .catch((error) => {
      setIsLoading(false);
      return false;
    });
  }
  /** レスポンスからカレンダー一覧の形式に変えてセットする */
  const getTitle = (calendar) => {
    //calendar.subject
    let attendeesNames = calendar.attendees.map(a => a.name);
    let attendees = attendeesNames.join("、");
    console.log(attendeesNames.length);
    if(attendeesNames.length > 3){
      attendeesNames = attendeesNames.slice(0, 3);
      attendees = `${attendeesNames.join("、")}${MESSAGE.ATTENDEES_OTHER}`;
    }
    return `${calendar.subject} ${MESSAGE.ATTENDEES}${attendees}`;
  }
  /** レスポンスからカレンダー一覧の形式に変えてセットする */
  const makeScheduleList = (scheduleList) => {
    let _scheduleList = [];
    scheduleList.events.map((calendar) => {
      let addCalendar = {
        title: getTitle(calendar),
        start: parseStringToISODate(calendar.start.dateTime),
        end: parseStringToISODate(calendar.end.dateTime),
        allDay: false,
        event_id: calendar.id,
      }
      _scheduleList= [..._scheduleList, addCalendar];
    });
    setScheduleList(_scheduleList);
  }

  return (
    <div className="myCustomHeight">
      <Dialog
        open={facilityScheduleOpen}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            maxWidth: '600px',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Calendar
              localizer={localizer}
              views={{
                month: false,
                week: false,
                agenda: false,
                day: true
              }}
              view={view}
              events={scheduleList}
              startAccessor="start"
              endAccessor="end"
              style={{ width: 500, height: 700 }}
              onNavigate={onNavigate}
              onSelectEvent={onSelectEvent}
              onSelectSlot={onSelectSlot}
              onView={onView}
              defaultDate={parseStringToDate(selectSeatDate)}
              scrollToTime={parseStringToNineHours(selectSeatDate)}
              Date={parseStringToDate(selectSeatDate)}
              
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <ButtonGroup size="small" aria-label="small button group">
            <Button startIcon={<MeetingRoomIcon />} onClick={() => onClickFacilityRegistButton()}>
              {MESSAGE.FACILITY_REGIST_BUTTON}
            </Button>
          </ButtonGroup>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default FacilitySchedule;