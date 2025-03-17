import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { SidebarItem } from './components/SidebarItem';
import LinkIcon from '@app/assets/icons/LinkIcon.tsx';
import gift from '@app/assets/images/gift.png';
import { ActionImgWrapper, CopyButton } from './items.style';
import { useAirdropStore } from '@app/store';
import { useCopyToClipboard } from '@app/hooks';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

export default function Invite() {
    const { t } = useTranslation('airdrop');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const referralCode = useAirdropStore((state) => state.userDetails?.user?.referral_code || '');

    function handleCopy() {
        copyToClipboard(`${airdropUrl}/download/${referralCode}`);
    }

    const inviteTooltipContent = (
        <>
            <Typography variant="h6">{t('inviteFriends')}</Typography>
            <Typography variant="p">{t('inviteFriendsText')}</Typography>
        </>
    );
    const inviteHoverContent = <CopyButton onClick={handleCopy}>{isCopied ? <CheckSvg /> : <LinkIcon />}</CopyButton>;
    return referralCode?.length ? (
        <SidebarItem text={t('invite')} tooltipContent={inviteTooltipContent} hoverContent={inviteHoverContent}>
            <ActionImgWrapper>
                <img src={gift} alt="gift image" style={{ height: 30 }} />
            </ActionImgWrapper>
        </SidebarItem>
    ) : null;
}
