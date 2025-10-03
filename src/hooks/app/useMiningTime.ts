import { useEffect } from 'react';
import { checkMiningTime } from '@app/store/actions/miningStoreActions.ts';
import { useConfigMiningStore } from '@app/store';

export default function useMiningTime() {
    const needsAlertCheck = useConfigMiningStore((s) => s.eco_alert_needed);
    useEffect(() => {
        if (!needsAlertCheck) return;
        const INTERVAL = 1000 * 60 * 60 * 3; // every three hours - it is also checked on stop
        const interval = setInterval(() => {
            checkMiningTime();
        }, INTERVAL);

        return () => clearInterval(interval);
    }, [needsAlertCheck]);
}
