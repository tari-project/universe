import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { networkSupportsL2 } from '@app/utils/network.ts';

/**
 * Whether L2 shows at all: the sidebar button, the panel and the settings tab. On every L2 network
 * (MainNet and Esmeralda) it waits for the wallet-available flag, or the live flag, which implies it.
 */
export const useHasL2Access = () => {
    const network = useMiningStore((s) => s.network);
    const flagged = useAirdropStore(
        (s) =>
            !!s.features?.some(
                (f) => f === FEATURE_FLAGS.FF_OOTLE_WALLET_AVAILABLE || f === FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE
            )
    );
    return networkSupportsL2(network) && flagged;
};
