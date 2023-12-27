import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import FloorAndDate from './FloorAndDate';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

const TemporaryDrawer = (props) => {
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  /** メニューの開閉 */
  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 250 }}
      role="presentation"
      
    >
      <Divider />
      <List>
      <FloorAndDate
        floor={props.floor}
        handleChange={props.handleChange}
        floorList={props.floorList}
        seatDate={props.seatDate}
        dateChange={props.dateChange}
      />
      <div>
        <a className="MuiTypography-root MuiTypography-inherit MuiLink-root MuiLink-underlineAlways css-10t6qxf" href="https://nscbgrn.cosmoroot.co.jp/script/cbgrn/grn.cgi/bulletin/draft_view?aid=41" target="_blank">座席予約管理システム運用方法</a>
      </div>
      </List>
    </Box>
  );

  const anchor = "left";

  return (
    <div>
      <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(anchor, true)}
            sx={{ mr: 1 }}
            size="small"
          ><MenuIcon />
      </IconButton>
      <Drawer
        anchor={anchor}
        open={state[anchor]}
        onClose={toggleDrawer(anchor, false)}
      >
        {list(anchor)}
      </Drawer>
    </div>
  );
}

export default TemporaryDrawer;