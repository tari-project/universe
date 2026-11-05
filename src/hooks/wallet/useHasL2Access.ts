import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Network, networkSupportsL2 } from '@app/utils/network.ts';

/**
 * Whether L2 shows at all: the sidebar button, the panel and the settings tab. On MainNet it waits for
 * the pre-burn flag (or the live flag, which implies it); other L2 networks are open as before.
 */
export const useHasL2Access = () => {
    const network = useMiningStore((s) => s.network);
    const flagged = useAirdropStore(
        (s) =>
            !!s.features?.some(
                (f) => f === FEATURE_FLAGS.FF_OOTLE_PRE_BURN || f === FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE
            )
    );
    return networkSupportsL2(network) && (network !== Network.MainNet || flagged);
};
