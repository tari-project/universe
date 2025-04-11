import { useAirdropStore } from '@app/store';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';

import { useCopyToClipboard } from '@app/hooks';
import LinkIcon from '@app/assets/icons/LinkIcon.tsx';
import { useTranslation } from 'react-i18next';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';
import { ActionButton, ActionContentWrapper, ButtonIconWrapper } from './actions.style.ts';

export default function AirdropInvite() {
    const { t } = useTranslation('airdrop');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const referralCode = useAirdropStore((s) => s.userDetails?.user?.referral_code);

    function handleCopyClick() {
        copyToClipboard(`${airdropUrl}/download/${referralCode}`);
    }
    const action = (
        <ActionButton onClick={handleCopyClick}>
            <ButtonIconWrapper>{isCopied ? <CheckSvg /> : <LinkIcon />}</ButtonIconWrapper>
            <ActionContentWrapper>{t(isCopied ? 'copied' : 'inviteFriendsText')}</ActionContentWrapper>
        </ActionButton>
    );

    return referralCode ? (
        <SyncActionCard
            action={action}
            title={'Invite Friends'}
            subtitle={'For every friend that uses your invite link, you receive 5,000 gems.'}
        />
    ) : null;
}
