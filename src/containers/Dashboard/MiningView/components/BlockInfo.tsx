import { Stack, Typography, Divider } from '@mui/material';
import useAppStateStore from "../../../../store/appStateStore.ts";
import {useEffect, useState} from "react";

function BlockInfo() {
    // let [blockHeight,  blockTime] =  useAppStateStore((state) => ({
    //     blockHeight: state.blockHeight,
    //     blockTime: state.blockTime,
    // }));

    // const [timeSince, setTimeSince] = useState('');

    // useEffect(() => {
    //     // Function to calculate the time difference
    //     const calculateTimeSince = () => {
    //         const now = new Date();
    //         const past = new Date(blockTime * 1000); // Convert seconds to milliseconds
    //         const diff = now - past;
    //
    //         // Convert the difference to days, hours, minutes, and seconds
    //         const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    //         const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    //         const minutes = Math.floor((diff / 1000 / 60) % 60);
    //         const seconds = Math.floor((diff / 1000) % 60);
    //
    //         if (days > 0) {
    //             setTimeSince(`${days}.${hours}::${minutes}::${seconds}`);
    //         } else if (hours > 0) {
    //             setTimeSince(`${hours}::${minutes}::${seconds}`);
    //
    //         }else {
    //             setTimeSince(`${minutes}::${seconds}`);
    //         }
    //     };
    //
    //     // Initial calculation
    //     calculateTimeSince();
    //
    //     // Update every second
    //     const interval = setInterval(calculateTimeSince, 1000);
    //
    //     // Cleanup interval on component unmount
    //     return () => clearInterval(interval);
    // }, [blockTime]);

  return (
    <Stack direction="row" spacing={2}>
      <Stack>
        <Typography variant="h6">#{blockHeight}</Typography>
        <Typography variant="body2">Floor</Typography>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack>
        <Typography variant="h6">Tiny Green Whales</Typography>
        <Typography variant="body2">Last floor winner</Typography>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack>
        <Typography variant="h6">0</Typography>
        <Typography variant="body2">Current floor build time</Typography>
      </Stack>
    </Stack>
  );
}

export default BlockInfo;
