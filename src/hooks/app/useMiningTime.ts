import { useEffect } from 'react';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
import { useConfigMiningStore } from '@app/store';

export default function useMiningTime() {
    const needsAlertCheck = useConfigMiningStore((s) => s.eco_alert_needed);
    useEffect(() => {
        if (!needsAlertCheck) return;
        const interval = setInterval(() => {
            checkMiningTime();
        }, 1000 * 5);

        return () => clearInterval(interval);
    }, [needsAlertCheck]);
}
