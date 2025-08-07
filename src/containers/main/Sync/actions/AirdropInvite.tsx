import { useTranslation } from 'react-i18next';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';

import { useAirdropStore } from '@app/store';
import LinkIcon from '@app/assets/icons/LinkIcon.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';
import { ActionButton, ActionContentWrapper, ButtonIconWrapper } from './actions.style.ts';

export default function AirdropInvite() {
    const { t } = useTranslation('airdrop');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdrop_url || '');
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
        <SyncActionCard action={action} title={t('inviteFriends')} subtitle={t('invite-friends-gems')} />
    ) : null;
}
