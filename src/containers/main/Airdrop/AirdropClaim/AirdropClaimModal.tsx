import { MonthlyTrancheClaimModal } from '@app/components/airdrop';
import { useAirdropStore } from '@app/store';
import { closeTrancheModal } from '@app/store/actions/airdropStoreActions';
import { FEATURE_FLAGS } from '@app/store/consts.ts';

export default function AirdropClaimModal() {
    const features = useAirdropStore((s) => s.features);
    const showModal = useAirdropStore((state) => state.showTrancheModal);

    const onClose = () => {
        closeTrancheModal();
    };

    const claimEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);

    if (!claimEnabled) {
        return null;
    }

    // Always use the new modal design - it handles both tranche and legacy claims
    return <MonthlyTrancheClaimModal showModal={showModal} onClose={onClose} />;
}
