import React, { memo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SignalCellular1BarIcon from '@mui/icons-material/SignalCellular1Bar';
import SignalCellular2BarIcon from '@mui/icons-material/SignalCellular2Bar';
import SignalCellular3BarIcon from '@mui/icons-material/SignalCellular3Bar';
import SignalCellular4BarIcon from '@mui/icons-material/SignalCellular4Bar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grow from '@mui/material/Grow';
import Chip from '@mui/material/Chip';
import WifiIcon from '@mui/icons-material/Wifi';
import RouterIcon from '@mui/icons-material/Router';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import Divider from '@mui/material/Divider';
import SignalWifi2BarLockIcon from '@mui/icons-material/SignalWifi2BarLock';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';

import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import LabelIcon from '@mui/icons-material/Label';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import IosShareIcon from '@mui/icons-material/IosShare';

import { IconEmptyWifi } from '../../icons';

import { WifiWizard2 } from '@awesome-cordova-plugins/wifi-wizard-2';
import SwipeableViews from 'react-swipeable-views';

import toast from 'react-hot-toast';

import Notify from '../../components/Notify';

const notify = ({ title= 'Thông báo', body = 'Push notìy thành công!' }) => toast.custom((t) => (
  <Notify title={title} body={body} state={t} />
), {
  duration: 5000,
});

interface NetworkType {   
  "level"?: any
  "SSID": string,
  "BSSID": string,
  "frequency"?: number,
  "capabilities"?: any,
  "timestamp"?: any,
  "channelWidth"?: any,
  "centerFreq0"?: any,
  "centerFreq1"?: any,
}

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}
interface ListWifiType {
  scan: boolean,
  presentNetwork: NetworkType | undefined,
  networks: [NetworkType] | undefined,
  handleScan: () => void,
  onPresentNetworkChange: (network: NetworkType | undefined) => void,
}
interface InfoWifiType {
  presentNetwork: PresentNetworkType | undefined,
}

interface PresentNetworkType {
  SSID: string | undefined,
  BSSID: string | undefined,
  ip?: string,
  subnet?: string,
  RouterIP?: string,
}

const vnPresentNetworkType = {
  SSID: 'hidden',
  BSSID: 'Địa chỉ MAC',
  ip: 'IP Application',
  subnet: 'Subnet',
  RouterIP: 'IP Router',
}

const modeSelect = {
  'node': [
    {
      type: 'reset-wifi',
      icon: <RestartAltIcon />,
      content: 'reset wifi',
      dialogMessage: 'Node này sẽ bị khôi phục cài đặt kết nối wifi, bạn chắc chứ?',
      onclick: (): void => {},
    },
    {
      type: 'link-app',
      icon: <IosShareIcon />,
      content: 'liên kết ứng dụng',
      dialogMessage: 'Node này sẽ tiến hành liên kết với ứng dụng(tài khoản), bạn chắc chứ?',
      onclick: (): void => {},
    }
  ],
  'wifi': [
    {
      type: 'disconect-wifi',
      icon: <WifiOffIcon />,
      content: 'ngắt kết nối',
      dialogMessage: 'Wifi này sẽ bị tắt kết nối, bạn chắc chứ?',
      onclick: async (SSID: string): Promise<void> => {
        try {
          if(SSID) {
            await WifiWizard2.disable(SSID);
            notify({ body: `wifi ${SSID} đã bị disconect.` });
          }
        } catch (error) {
          console.log(error);
          notify({ body: `wifi ${SSID} không thể disconect!`, title: 'Lỗi rồi' });
        }
      }
    },
    {
      type: 'default-network',
      icon: <SignalWifi2BarLockIcon />,
      content: 'đặt mặc định',
      dialogMessage: 'Wifi này sẽ tự động kết nối lại mỗi khi cấu hình node xong?',
      onclick: (SSID: string): void => {
        notify({ body: `wifi ${SSID} đã được đặt thành mặt định.` });
        localStorage.setItem('wifi-default', SSID);
      },
    }
  ]
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

function checkLevelSignal(level: number) {
  let convert = level * (-1);
  if(convert > 30 && convert < 50) {
    // signal large
    return <SignalCellular4BarIcon />
  }else if(convert >= 50 && convert < 70) {
    // signal medium - 2
    return <SignalCellular3BarIcon />
  }else if(convert >= 70 && convert < 90) {
    // signal medium - 1
    return <SignalCellular2BarIcon />
  }
  else {
    // signal small
    return <SignalCellular1BarIcon />
  }
}

function ListWifi({ networks, handleScan, scan, presentNetwork, onPresentNetworkChange }: ListWifiType) {
  const [wifiDefault, setWifiDefault] = useState<string>('');
  const [connectWifi, setConnectWifi] = useState<NetworkType>()
  const [password, setPassword] = useState<string>('');
  const [loadingWifi, setLoadingWifi] = useState<boolean>(false);
  const [loadingIcon, setLoadingIcon] = useState<boolean>(false);
  const [sizeIconLoading, setSizeIconLoading] = useState<number>(20);
  const [ssidIconLoading, setSsidIconLoading] = useState<string>();

  useEffect(() => {
    const wifi = localStorage.getItem('wifi-default') || '';
    setWifiDefault(wifi);
  }, [])

  const handleConnectToWifi = async (network: NetworkType) => {
    setLoadingIcon(true);
    setSsidIconLoading(network.SSID);
    try {
      if(network.SSID === presentNetwork?.SSID) {
        notify({ body: `wifi ${network.SSID} đã được kết nối.` });
      }else {
        let networksSaved: string[] = await WifiWizard2.listNetworks();
        networksSaved = networksSaved.map(network => network.replaceAll("\"", ""));
        if(networksSaved.includes(network.SSID)) {
          const checkWifiEnabled = await WifiWizard2.isWifiEnabled();
          if(!checkWifiEnabled) {
            await WifiWizard2.enableWifi();
          }
          const algorithm = network.capabilities.split("-")[0].replace('[', '') || 'WPA';
          await WifiWizard2.connect(network.SSID, true, undefined, algorithm === 'WPA2' ? 'WPA' : algorithm);
          onPresentNetworkChange(network);
          notify({ body: `Đã kết nối với wifi ${network.SSID}.` });
        }else {
          setConnectWifi(network);
        }
      }
    } catch (error) {
      console.log(error);
      notify({ body: `Có lỗi xảy ra khi kết nối với wifi ${network.SSID}.`, title: 'Lỗi rồi' });
    }
    setLoadingIcon(false);
    setSsidIconLoading(undefined);
  }

  const changePassword = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPassword(event.currentTarget.value);
  }

  const handleCloseDialog = () => {
    setConnectWifi(undefined);
  }

  const connectWifiWithPassword = async () => {
    setLoadingWifi(true);
    try {
      const checkWifiEnabled = await WifiWizard2.isWifiEnabled();
      if(!checkWifiEnabled) {
        await WifiWizard2.enableWifi();
      }
      if(connectWifi?.SSID) {
        const algorithm = connectWifi.capabilities.split("-")[0].replace('[', '') || 'WPA';
        console.log(algorithm);
        const result = await WifiWizard2.connect(connectWifi?.SSID, true, password, algorithm === 'WPA2' ? 'WPA' : algorithm);
        onPresentNetworkChange(connectWifi);
        notify({ body: `Đã kết nối với wifi ${connectWifi?.SSID}.` });
        console.log(result);
      }else {
        throw new Error('target SSID connect is undefined');
      }
    } catch (error) {
      console.log(error);
      notify({ body: `Có lỗi xảy ra khi kết nối với wifi ${connectWifi?.SSID}.`, title: 'Lỗi rồi' });
    }
    setLoadingWifi(false);
    handleCloseDialog();
  }

  return (
    <>
      <Dialog
        open={connectWifi?.SSID ? true : false }
        onClose={handleCloseDialog}
        fullWidth
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>{`Thiết lập kết nối đến ${connectWifi?.SSID}?`}</DialogTitle>
        <DialogContent sx={{ paddingTop: '10px !important' }}>
          <TextField fullWidth value={password} onChange={changePassword} id="outlined-basic" label="Mật khẩu WIFI" variant="outlined" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Huỷ</Button>
          <Button onClick={connectWifiWithPassword} startIcon={loadingWifi ? <CircularProgress size={sizeIconLoading} /> : null}>
            Kết nối
          </Button>
        </DialogActions>
      </Dialog>
      <Box className='flex flex-col flex-1'>
        <Box className='py-6'>
          <Box className='w-52 min-h-[13rem] relative mx-auto'>
            <Box component="div" className={`w-full h-full absolute top-0 left-0 m-auto rounded-full bg-indigo-200 flex justify-center items-center transition-transform ${scan ? 'scale-90 opacity-60' : 'scale-100' }`}>
              <Box component="div" className='w-3/4 h-3/4 m-auto rounded-full bg-indigo-300 flex justify-center items-center' />
              <Box component="div" className={`w-3/4 h-3/4 absolute m-auto rounded-full bg-indigo-200 flex justify-center items-center ${ scan ? 'animate-ping' : 'animate-none bg-transparent' }`} />
              <Box component="div" className={`w-3/4 h-3/4 ease-[cubic-bezier(0.8, -0.44, 0, 1.01)] absolute z-10 rounded-full before:absolute before:-left-[5px] before:-translate-x-full before:bg-indigo-400 before:w-4 before:h-4 before:rounded-full before:transition-opacity flex justify-center items-center ${ scan ? 'animate-[miruSpin_1.5s_ease-in-out_infinite] before:opacity-100' : 'animate-none before:opacity-0' }`} />
              <Box component="div" className={`w-3/4 h-3/4 ease-[cubic-bezier(0.8, -0.44, 0, 1.01)] absolute z-10 rounded-full before:absolute before:-left-[5px] before:-translate-x-full before:bg-indigo-400 before:w-4 before:h-4 before:rounded-full before:transition-opacity flex justify-center items-center ${ scan ? 'animate-[miruSpin_1.5s_40ms_ease-in-out_infinite] before:opacity-100' : 'animate-none before:opacity-0' }`} />
              <Box component="div" className={`w-3/4 h-3/4 ease-[cubic-bezier(0.8, -0.44, 0, 1.01)] absolute z-10 rounded-full before:absolute before:-left-[5px] before:-translate-x-full before:bg-indigo-400 before:w-4 before:h-4 before:rounded-full before:transition-opacity flex justify-center items-center ${ scan ? 'animate-[miruSpin_1.5s_80ms_ease-in-out_infinite] before:opacity-100' : 'animate-none before:opacity-0' }`} />
              <Box component="div" className={`w-3/4 h-3/4 ease-[cubic-bezier(0.8, -0.44, 0, 1.01)] absolute z-10 rounded-full before:absolute before:-left-[5px] before:-translate-x-full before:bg-indigo-400 before:w-4 before:h-4 before:rounded-full before:transition-opacity flex justify-center items-center ${ scan ? 'animate-[miruSpin_1.5s_120ms_ease-in-out_infinite] before:opacity-100' : 'animate-none before:opacity-0' }`} />
              <Box component="div" className={`w-3/4 h-3/4 ease-[cubic-bezier(0.8, -0.44, 0, 1.01)] absolute z-10 rounded-full before:absolute before:-left-[5px] before:-translate-x-full before:bg-indigo-400 before:w-4 before:h-4 before:rounded-full before:transition-opacity flex justify-center items-center ${ scan ? 'animate-[miruSpin_1.5s_160ms_ease-in-out_infinite] before:opacity-100' : 'animate-none before:opacity-0' }`} />
            </Box>
            <Box onClick={handleScan} className='w-3/4 h-3/4 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
              <Button component="div" sx={{ borderRadius: '50%' }} className='w-full h-full bg-indigo-300 flex justify-center items-center'>
                <Box className={`flex flex-col items-center transition-colors ${scan ? 'text-white' : 'text-slate-50' }`}>
                  <Box className='text-6xl'>
                    <WifiIcon sx={{ color: 'currentcolor' }} fontSize='inherit' />
                  </Box>
                  <Typography variant="h6" sx={{ color: 'currentcolor' }} className='uppercase'>
                    { scan ? 'đang quét' : 'quét ngay' }
                  </Typography>
                </Box>
              </Button>
            </Box>
          </Box>
          {/* <Zoom in={!scan} style={{ transitionDelay: '500ms', }}>
          </Zoom> */}
        </Box>
        <Box className='flex-1 bg-white flex flex-col relative w-full rounded-t-3xl p-6 shadow-2xl'>
          <Box>
            <Typography variant="h5" className='text-slate-600'>
              Danh sách node
            </Typography>
            <Typography variant="subtitle1" className='text-green-400'>
              { networks?.length ? networks.length : 0 } node
            </Typography>
          </Box>
          <Box className='flex-1 my-2'>
            {
              networks?.length
              ?
              <Box className='overflow-y-scroll max-h-[355px]'>
                {
                  networks?.map((network: NetworkType) => (
                    <Button key={network['BSSID']} onClick={() => handleConnectToWifi(network)} sx={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', textTransform: 'unset' }} className='flex-nowrap w-full'>
                      { network.SSID.includes('esp') ? <Chip icon={ loadingIcon && ssidIconLoading === network.SSID ? <CircularProgress size={sizeIconLoading} /> : <RouterIcon />} label="node" /> : <Chip icon={ loadingIcon && ssidIconLoading === network.SSID ? <CircularProgress size={sizeIconLoading} /> : <WifiIcon /> } label="Wifi" /> } 
                      { network.BSSID === presentNetwork?.BSSID ? <Chip className='ml-2' label="connected" variant="outlined" color="success" /> : null }
                      { network.SSID === wifiDefault ? <Chip className='ml-2' label="default" variant="outlined" color="success" /> : null }
                      <Typography variant="h6" className='text-slate-600 flex-1 text-right pr-5'>
                        { network['SSID'] }
                      </Typography>
                      { checkLevelSignal(network['level']) }
                    </Button>
                  ))
                }
              </Box>
              :
              <Grow
                in={true}
                style={{ transformOrigin: '0 0 0' }}
                {...(networks?.length ? { timeout: 1000 } : {})}
              >
                <Box className='flex flex-col items-center justify-center h-full -m-8'>
                  <IconEmptyWifi className='w-32 h-32' />
                  <Typography variant="subtitle2" className='text-slate-600 text-center'>
                    wifi đang trống nhấn quét để tìm kiếm xung quanh.
                  </Typography>
                </Box>
              </Grow>
            }
          </Box>
        </Box>
      </Box>
    </>
  )
}

function InfoWifi({ presentNetwork }: InfoWifiType) {

  const [info, setInfo] = useState<PresentNetworkType>();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [messageSelect, setMessageSelect] = useState<string>('');
  const [functionDialog, setFunctionDialog] = useState<() => void>(() => () => {});
  const [typeWifi, setTypeWifi] = useState<string>(presentNetwork?.SSID?.includes('esp') ? 'node' : 'wifi');
  const open = Boolean(anchorEl);

  useEffect(() => {
    const infoWifi = async () => {
      const { ip, subnet } = await WifiWizard2.getWifiIPInfo()
      const RouterIP = await WifiWizard2.getWifiRouterIP()
      setTypeWifi(presentNetwork?.SSID?.includes('esp') ? 'node' : 'wifi')
      setInfo({ SSID: presentNetwork?.SSID, BSSID: presentNetwork?.BSSID, ip, subnet, RouterIP });
    }
    infoWifi();
  } ,[presentNetwork])

  useEffect(() => {
    if(typeWifi === 'node') {

    }
  }, [typeWifi])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  }

  const closeDialog = () => {
    setMessageSelect('');
  }

  const askBeforeExecute = (type: string, dialogMessage: string, callback: () => void) => {
    setMessageSelect(dialogMessage);
    setFunctionDialog(() => () => { callback(); closeDialog(); })
    handleClose();
  }

  return (
    <>
      <Dialog
        open={messageSelect ? true : false}
        onClose={() => closeDialog() }
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Chú ý"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            { messageSelect }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeDialog() }>Huỷ</Button>
          <Button onClick={() => { functionDialog() }} autoFocus>
            Đồng ý
          </Button>
        </DialogActions>
      </Dialog>
      <Box className='p-5'>
        <Box className='flex flex-nowrap items-center justify-between'>
          <Typography variant="h6" sx={{ color: 'currentcolor' }} className='uppercase flex items-center'>
            { typeWifi === 'node' ? <RouterIcon className='mr-3' /> : <WifiIcon className='mr-3' /> }
            { info?.SSID || '' }
          </Typography>
          <Button onClick={handleClick} variant='outlined' endIcon={<SettingsIcon />} >
            cài đặt
          </Button>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
            {
              typeof info?.SSID === 'string'
              ?
                <List>
                  {
                    modeSelect[typeWifi as keyof typeof modeSelect].map(({ icon, type, dialogMessage, content, onclick }, index) => (
                      <ListItem key={content + index} onClick={() => { askBeforeExecute(type, dialogMessage, () => { onclick(info?.SSID || '') }) }} disablePadding>
                        <ListItemButton>
                          <ListItemIcon>
                            { icon }
                          </ListItemIcon>
                          <ListItemText primary={content} />
                        </ListItemButton>
                      </ListItem>
                    ))
                  }
                </List>
              :
              <Box sx={{ display: 'flex' }}>
                <CircularProgress />
              </Box>
            }
        </Popover>
        <Box className='mt-10'>
          {
            Object.keys(info || {}).length > 0
            ?
              Object.entries(info || {}).map(([key, val]) => (
                
                vnPresentNetworkType[key as keyof typeof vnPresentNetworkType] === 'hidden'
                ?
                  null
                :
                <Box key={key}>
                  <Divider textAlign="left">
                    <Chip label={vnPresentNetworkType[key as keyof typeof vnPresentNetworkType]} />
                  </Divider>
                  <Typography sx={{ fontSize: '1.4rem' }} variant="subtitle1" className='py-3 text-slate-800 text-3xl'>
                    <LabelIcon className='mr-2 text-slate-700' />
                    { val }
                  </Typography>
                </Box>
              ))
            :
              null
          }
        </Box>
      </Box>
    </>
  )
}

function Connect() {
  const theme = useTheme();
  const [scan, setScan] = useState(false);
  const [networks, setNetworks] = useState<[NetworkType]>();
  const [presentNetwork, setPresentNetwork] = useState<NetworkType>();
  const [tab, setTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, tab: number) => {
    setTab(tab);
  };

  const handleChangeTabIndex = (tab: number) => {
    setTab(tab);
  };

  useEffect(() => {
    try {
      const request = async () => {
        const ssid = await WifiWizard2.getConnectedSSID();
        const bssid = await WifiWizard2.getConnectedBSSID();
        setPresentNetwork({ SSID: ssid, BSSID: bssid });
      };
      request();
    } catch (error) {
      console.log('Permision fail => ', error);
    }
  } ,[])

  const handleScan = useCallback(async () => {
    try {
      if(!scan) {
        setScan(true);
        const permission = await WifiWizard2.requestPermission();
        if(permission) {
          const networks = await WifiWizard2.scan({ numLevels: 0 });
          setNetworks(networks);
        }
        setScan(false);
        console.log(networks);
      }
    } catch (error) {
      console.log(error);
      setScan(false);
    }
  }, []);

  const handlePresentNetwork = useCallback((network: NetworkType | undefined) => {
    console.log(network);
    setPresentNetwork(network);
  }, []);

  return (
    // <Grow in={true}>
    <Box className='flex-1'>
      <Tabs
        value={tab}
        className='bg-white'
        onChange={handleChange}
        textColor="inherit"
        variant="fullWidth"
        aria-label="full width tabs example"
      >
        <Tab label="scan wifi" {...a11yProps(0)} />
        <Tab label="info wifi" {...a11yProps(1)} />
      </Tabs>
      <SwipeableViews
        className='bg-[#edf1f5]'
        style={{ height: '100%' }}
        containerStyle={{ height: '100%' }}
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={tab}
        onChangeIndex={handleChangeTabIndex}
      >
        <Box className='w-full h-full flex flex-col'>
          <ListWifi onPresentNetworkChange={handlePresentNetwork} networks={networks} scan={scan} presentNetwork={presentNetwork} handleScan={handleScan} />
        </Box>
        <Box className='w-full h-full flex flex-col'>
          <InfoWifi presentNetwork={presentNetwork} />
        </Box>
      </SwipeableViews>
    </Box>
    // {/* </Grow> */}
  );
}

export default memo(Connect);
