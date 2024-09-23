import { useMiningStore } from '@app/store/useMiningStore';
import { useEffect } from 'react';

const useMiningMetricsUpdater = () => {
    const fetchMiningMetrics = useMiningStore((s) => s.fetchMiningMetrics);
    useEffect(() => {
        const fetchMetricsInterval = setInterval(async () => {
            try {
                await fetchMiningMetrics();
            } catch (error) {
                console.error('Error fetching mining metrics:', error);
            }
        }, 1000);

        return () => {
            clearInterval(fetchMetricsInterval);
        };
    }, [fetchMiningMetrics]);
};

export default useMiningMetricsUpdater;
