import CircularProgress from '@mui/material/CircularProgress';
import { green } from '@mui/material/colors';
import { useAtomValue } from 'jotai';
import { isLoadingAtom } from './../components/Const';

const Progress = (props) => {
  const isLoading = useAtomValue(isLoadingAtom);
  return (
    <div>
      {isLoading && (
        <CircularProgress
          size={24}
          sx={{
            color: green[500],
            position: 'absolute',
            top: '30%',
            left: '30%',
            zIndex: 10000
          }}
        />
      )}
    </div>
  );
}

export default Progress;