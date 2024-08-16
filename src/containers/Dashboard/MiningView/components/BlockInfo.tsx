import { Stack, Typography, Divider } from '@mui/material';

import { useEffect, useState } from 'react';
import { useAppStatusStore } from '../../../../store/useAppStatusStore.ts';

function BlockInfo() {
    const base_node = useAppStatusStore((s) => s.base_node);
    const p2pool = useAppStatusStore((s) => s.p2pool_stats);
    const tribe = p2pool?.tribe.name;
    const minersCount = p2pool?.num_of_miners;
    const blockHeight = base_node?.block_height;
    const blockTime = base_node?.block_time || 1;
    const [timeSince, setTimeSince] = useState('');

    useEffect(() => {
        // Function to calculate the time difference
        const calculateTimeSince = () => {
            const now: Date = new Date();
            const past: Date = new Date(blockTime * 1000); // Convert seconds to milliseconds
            const diff: number = now.getTime() - past.getTime();

            // Convert the difference to days, hours, minutes, and seconds
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const hoursString = hours.toString().padStart(2, '0');
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                .toString()
                .padStart(2, '0');
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                .toString()
                .padStart(2, '0');

            if (days > 0) {
                setTimeSince(
                    `${days} day${days === 1 ? '' : 's'}, ${hoursString}:${minutes}:${seconds}`
                );
            } else if (hours > 0) {
                setTimeSince(`${hoursString}:${minutes}:${seconds}`);
            } else {
                setTimeSince(`${minutes}:${seconds}`);
            }
        };

        // Initial calculation
        calculateTimeSince();

        // Set interval to update the time since every second
        const interval = setInterval(calculateTimeSince, 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [blockTime]);

    return (
        <Stack direction="row" spacing={2}>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">{tribe}</Typography>
                <Typography variant="body2">Tribe</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">{minersCount}</Typography>
                <Typography variant="body2">Miners</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
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
                <Typography variant="h6">{timeSince}</Typography>
                <Typography variant="body2">
                    Current floor build time
                </Typography>
            </Stack>
        </Stack>
    );
}

export default BlockInfo;
