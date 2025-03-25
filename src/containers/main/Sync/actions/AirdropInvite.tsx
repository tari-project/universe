import { useAirdropStore } from '@app/store';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { ButtonIconWrapper } from '@app/containers/main/Sync/actions/actions.style.ts';
import { useCopyToClipboard } from '@app/hooks';
import LinkIcon from '@app/assets/icons/LinkIcon.tsx';
import { useTranslation } from 'react-i18next';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

export default function AirdropInvite() {
    const { t } = useTranslation('airdrop');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const referralCode = useAirdropStore((s) => s.userDetails?.user?.referral_code);

    function handleCopyClick() {
        copyToClipboard(`${airdropUrl}/download/${referralCode}`);
    }
    const action = (
        <Button
            icon={<ButtonIconWrapper>{isCopied ? <CheckSvg /> : <LinkIcon />}</ButtonIconWrapper>}
            backgroundColor="grey"
            iconPosition="start"
            fluid
            onClick={handleCopyClick}
        >
            {t(isCopied ? 'copied' : 'inviteFriendsText')}
        </Button>
    );

    return referralCode ? (
        <SyncActionCard
            action={action}
            title={'Invite Friends'}
            subtitle={'For every friend that uses your invite link, you receive 5,000 gems.'}
        />
    ) : null;
}
