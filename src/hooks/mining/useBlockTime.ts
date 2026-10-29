// the sauce of truth for all block time fmts

import { useMemo, useSyncExternalStore } from 'react';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';
import { useBlockTip } from '@app/hooks/mining/useBlockTip.ts';

let currentNowSec = Math.floor(Date.now() / 1000);
let sharedInterval: NodeJS.Timeout | null = null;
const subscribers = new Set<() => void>();

function subscribeBlockClock(listener: () => void) {
    subscribers.add(listener);
    if (sharedInterval === null) {
        currentNowSec = Math.floor(Date.now() / 1000);
        sharedInterval = setInterval(() => {
            currentNowSec = Math.floor(Date.now() / 1000);
            for (const sub of subscribers) {
                sub();
            }
        }, 1000);
    }

    return () => {
        subscribers.delete(listener);
        if (subscribers.size === 0 && sharedInterval !== null) {
            clearInterval(sharedInterval);
            sharedInterval = null;
        }
    };
}

function getBlockClockSnapshot() {
    return currentNowSec;
}

export default function useBlockTime() {
    const { data } = useBlockTip();
    const nowSec = useSyncExternalStore(subscribeBlockClock, getBlockClockSnapshot, getBlockClockSnapshot);

    return useMemo<{ currentTimeParts?: TimeSince; currentTimeShort: string }>(() => {
        if (!data?.timestamp) {
            return { currentTimeParts: undefined, currentTimeShort: '00:00' };
        }
        const timestampSec = Number(data.timestamp);
        const nowMs = nowSec * 1000;
        const elapsedSeconds = Math.max(0, nowSec - Math.floor(timestampSec));
        const minutes = Math.floor(elapsedSeconds / 60);
        const remainingSeconds = elapsedSeconds % 60;
        const currentTimeShort = `${minutes.toString().padStart(2, '0')}:${remainingSeconds
            .toString()
            .padStart(2, '0')}`;
        const currentTimeParts = calculateTimeSince(timestampSec, nowMs);
        return { currentTimeParts, currentTimeShort };
    }, [data?.timestamp, nowSec]);
}
