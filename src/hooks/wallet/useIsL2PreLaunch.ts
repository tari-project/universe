import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { networkSupportsL2 } from '@app/utils/network.ts';

/** Any L2 network (MainNet and Esmeralda) before the Ootle launch: the live flag alone ends it, and features not loaded yet still count as before. */
export const useIsL2PreLaunch = () => {
    const onL2Network = useMiningStore((s) => networkSupportsL2(s.network));
    const isLive = useAirdropStore((s) => !!s.features?.includes(FEATURE_FLAGS.FF_OOTLE_MAINNET_LIVE));
    return onL2Network && !isLive;
};
