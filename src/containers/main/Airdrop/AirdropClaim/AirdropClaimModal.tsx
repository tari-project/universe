import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { closeTrancheModal } from '@app/store/actions/airdropStoreActions';
import { MonthlyTrancheClaimModal } from '@app/components/airdrop/MonthlyTrancheClaimModal.tsx';
import InvestorClaimModal from './InvestorClaimModal.tsx';

export default function AirdropClaimModal() {
    const features = useAirdropStore((s) => s.features);
    const showModal = useAirdropStore((state) => state.showTrancheModal);
    const claimEnabled = features?.includes(FEATURE_FLAGS.FF_AD_CLAIM_ENABLED);

    const onClose = () => {
        closeTrancheModal();
    };

    return (
        <>
            {claimEnabled && <MonthlyTrancheClaimModal showModal={showModal} onClose={onClose} />}
            <InvestorClaimModal />
        </>
    );
}
