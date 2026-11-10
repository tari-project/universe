// the sauce of truth for all block time fmts

import { useMemo, useSyncExternalStore } from 'react';
import calculateTimeSince, { TimeSince } from '@app/utils/calculateTimeSince.ts';
import { useBlockTip } from '@app/hooks/mining/useBlockTip.ts';

const listeners = new Set<() => void>();
let sharedInterval: ReturnType<typeof setInterval> | null = null;
let currentTick = 0;

function subscribeSecondTick(listener: () => void): () => void {
    listeners.add(listener);
    if (sharedInterval === null) {
        sharedInterval = setInterval(() => {
            currentTick += 1;
            listeners.forEach((cb) => cb());
        }, 1000);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && sharedInterval !== null) {
            clearInterval(sharedInterval);
            sharedInterval = null;
        }
    };
}

function getTickSnapshot(): number {
    return currentTick;
}

export default function useBlockTime() {
    const { data } = useBlockTip();
    const tick = useSyncExternalStore(subscribeSecondTick, getTickSnapshot);

    return useMemo<{ currentTimeParts: TimeSince | undefined; currentTimeShort: string }>(() => {
        void tick;
        const timestamp = data?.timestamp;
        const now = Date.now();
        const elapsedSeconds = timestamp ? Math.max(0, Math.floor((now - timestamp * 1000) / 1000)) : tick;
        const minutes = Math.floor(elapsedSeconds / 60);
        const remainingSeconds = elapsedSeconds % 60;
        const currentTimeShort = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        const currentTimeParts = timestamp ? calculateTimeSince(Number(timestamp), now) : undefined;
        return { currentTimeParts, currentTimeShort };
    }, [data?.timestamp, tick]);
}
