import { memo } from "react";
import CircularProgress, {
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import icon from '../index';

interface PayloadType {
  device: {
    id: string,
    name: string,
    sub: string,
    value: number,
    icon: string,
    type: string,
  }
}

function Progress({ device }: PayloadType) {

  return (
    <Box className='flex flex-nowrap'>
      <Box className=''>
        { device.icon in icon ? icon[device.icon as keyof typeof icon] : icon['light'] }
      </Box>
      <Box className="flex flex-col items-center ">
        <Box className='w-36 h-36' sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgressbar styles={buildStyles({
            pathColor: 'rgb(99, 102, 241)',
          })} value={device.value} />;
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box className='flex flex-col items-center'>
              <Typography
                variant="caption"
                className='text-slate-600 text-lg'
                sx={{ fontSize: '1.5rem' }}
                component="div"
              >{`${Math.round(device.value)}%`}</Typography>
              <Typography
                variant="caption"
                className='text-slate-600 text-lg capitalize'
              >{ device.name }</Typography>
            </Box>
          </Box>
        </Box>
        <Typography
          variant="subtitle1"
          className='text-slate-600 capitalize pt-3'
        >{ device.sub }</Typography>
      </Box>
    </Box>
  );
}

export default memo(Progress);
