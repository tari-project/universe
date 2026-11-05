import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { Network } from '@app/utils/network.ts';

/** MainNet before the Ootle launch: the live flag alone ends it, and features not loaded yet still count as before. */
export const useIsL2PreLaunch = () => {
    const isMainNet = useMiningStore((s) => s.network === Network.MainNet);
    const isLive = useAirdropStore((s) => !!s.features?.includes(FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE));
    return isMainNet && !isLive;
};
