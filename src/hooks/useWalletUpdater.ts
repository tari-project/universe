import { useWalletStore } from '@app/store/useWalletStore';
import { useEffect } from 'react';

const useWalletDetailsUpdater = () => {
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);

    useEffect(() => {
        const fetchWalletInterval = setInterval(async () => {
            try {
                await fetchWalletDetails();
            } catch (error) {
                console.error('Error fetching wallet details:', error);
            }
        }, 1000);

        return () => {
            clearInterval(fetchWalletInterval);
        };
    }, [fetchWalletDetails]);
};

export default useWalletDetailsUpdater;
