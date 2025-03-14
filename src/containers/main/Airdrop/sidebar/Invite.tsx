import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { SidebarItem } from './components/SidebarItem';
import LinkIcon from '@app/assets/icons/LinkIcon.tsx';
import gift from '@app/assets/images/gift.png';
import { ActionImgWrapper } from './items.style';

export default function Invite() {
    const { t } = useTranslation('airdrop');
    const inviteTooltipContent = (
        <>
            <Typography variant="h6">{t('inviteFriends')}</Typography>
            <Typography variant="p">{t('inviteFriendsText')}</Typography>
        </>
    );
    const inviteHoverContent = (
        <>
            <LinkIcon />
        </>
    );
    return (
        <SidebarItem text={t('invite')} tooltipContent={inviteTooltipContent} hoverContent={inviteHoverContent}>
            <ActionImgWrapper>
                <img src={gift} alt="gift image" style={{ height: 30 }} />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
