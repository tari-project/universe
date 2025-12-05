import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { closeTrancheModal } from '@app/store/actions/airdropStoreActions';
import { MonthlyTrancheClaimModal } from '@app/components/airdrop/MonthlyTrancheClaimModal.tsx';

export default function AirdropClaimModal() {
    const features = useAirdropStore((s) => s.features);
    const showModal = useAirdropStore((state) => state.showTrancheModal);
    const claimEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);

    const onClose = () => {
        closeTrancheModal();
    };

    if (!claimEnabled) {
        return null;
    }

    // Always use the new modal design - it handles both tranche and legacy claims
    return <MonthlyTrancheClaimModal showModal={false} onClose={onClose} />;
}
