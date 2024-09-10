import { useInterval } from '@app/hooks/useInterval.ts';
import { setLighting } from '@app/visuals.ts';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { useShallow } from 'zustand/react/shallow';

const INTERVAL = 1000 * 60 * 10; // every 10 min

export function useLighting() {
    const isSettingUp = useAppStateStore(useShallow((s) => s.isSettingUp));
    const hasSetInit = useRef(false);
    const getSunPosition = useCallback(() => {
        // Get the current time
        const now = new Date();
        // Get the local time in hours (0-24)
        const hours = now.getHours() + now.getMinutes() / 60;
        // Estimate the sun's x position: -1 is sunrise (6 AM), 0 is noon, 1 is sunset (6 PM)
        const x = Math.cos(((hours - 6) / 12) * Math.PI);
        // Estimate the sun's y position: 0 is the horizon, 1 is directly overhead at noon
        const y = Math.max(0, Math.sin(((hours - 6) / 12) * Math.PI));
        return { x, y };
    }, []);

    const { x: sunX, y: sunY } = getSunPosition();
    // normalise for webgl vals
    const x = Math.round(sunX * 100) / 10;
    const y = Math.round(sunY * 100) / 10;
    const z = Math.round((y + x) * 100) / 100;

    useLayoutEffect(() => {
        if (hasSetInit.current || isSettingUp) {
            return;
        }

        setLighting(x, y, z);
        hasSetInit.current = true;
    }, [isSettingUp, x, y, z]);

    useInterval(() => {
        setLighting(x, y, z);
    }, INTERVAL);
}
