import { MonthlyTrancheClaimModal } from '@app/components/airdrop';
import { useAirdropStore } from '@app/store';
import { closeTrancheModal } from '@app/store/actions/airdropStoreActions';

export default function AirdropClaimModal() {
    const showModal = useAirdropStore((state) => state.showTrancheModal);

    const onClose = () => {
        closeTrancheModal();
    };

    // Always use the new modal design - it handles both tranche and legacy claims
    return <MonthlyTrancheClaimModal showModal={showModal} onClose={onClose} />;
}
