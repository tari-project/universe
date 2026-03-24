import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { closeVipTrancheModal } from '@app/store/actions/airdropStoreActions';
import { MonthlyTrancheClaimModal } from '@app/components/airdrop/MonthlyTrancheClaimModal.tsx';
import { useTrancheStatus } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';

export default function VipClaimModal() {
    const features = useAirdropStore((s) => s.features);
    const showModal = useAirdropStore((state) => state.showVipTrancheModal);
    const vipEnabled = features?.includes(FEATURE_FLAGS.FF_VIP_CLAIM_ENABLED);

    // Only fetch VIP tranches when the flag is enabled
    const { data: vipTranches } = useTrancheStatus(!!vipEnabled, 'vip');

    const onClose = () => {
        closeVipTrancheModal();
    };

    // Fully gated: if flag is off OR user has no VIP tranches, render nothing
    if (!vipEnabled || !vipTranches || vipTranches.totalTranches === 0) {
        return null;
    }

    return <MonthlyTrancheClaimModal showModal={showModal} onClose={onClose} program="vip" />;
}
