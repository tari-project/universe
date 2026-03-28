import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS } from '@app/store/consts.ts';
import { closeInvestorTrancheModal } from '@app/store/actions/airdropStoreActions';
import { MonthlyTrancheClaimModal } from '@app/components/airdrop/MonthlyTrancheClaimModal.tsx';
import { useTrancheStatus } from '@app/hooks/airdrop/tranches/useTrancheStatus.ts';

export default function InvestorClaimModal() {
    const features = useAirdropStore((s) => s.features);
    const showModal = useAirdropStore((state) => state.showInvestorTrancheModal);
    const investorEnabled = features?.includes(FEATURE_FLAGS.FF_INVESTOR_CLAIM_ENABLED);

    // Only fetch Investor tranches when the flag is enabled
    const { data: investorTranches } = useTrancheStatus(!!investorEnabled, 'investor');

    const onClose = () => {
        closeInvestorTrancheModal();
    };

    // Fully gated: if flag is off OR user has no Investor tranches, render nothing
    if (!investorEnabled || !investorTranches || investorTranches.totalTranches === 0) {
        return null;
    }

    return <MonthlyTrancheClaimModal showModal={showModal} onClose={onClose} program="investor" />;
}
