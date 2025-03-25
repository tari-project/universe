import { useAirdropStore } from '@app/store';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';

export default function AirdropInvite() {
    const referralCode = useAirdropStore((s) => s.userDetails?.user?.referral_code);
    return referralCode ? (
        <SyncActionCard
            action={<div />}
            title={'Invite Friends'}
            subtitle={'For every friend that uses your invite link, you receive 5,000 gems.'}
        />
    ) : null;
}
