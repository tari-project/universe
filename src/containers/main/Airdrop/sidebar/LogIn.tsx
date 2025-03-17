import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, GemImg } from './items.style';
import { useTranslation } from 'react-i18next';
import gem from '@app/assets/images/gem.png';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function LogIn() {
    const { t } = useTranslation('airdrop');

    const tooltipContent = (
        <>
            <Typography variant="h6">{t('loggedOutTitle')}</Typography>
            <Typography variant="p">{t('topTooltipText')}</Typography>
        </>
    );
    return (
        <SidebarItem text={t('joinAirdrop')} tooltipContent={tooltipContent}>
            <ActionImgWrapper>
                <GemImg src={gem} alt="gem ico" />
            </ActionImgWrapper>
        </SidebarItem>
    );
}
