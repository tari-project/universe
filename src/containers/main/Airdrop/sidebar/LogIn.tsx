import { useTranslation } from 'react-i18next';

import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SidebarItem } from './components/SidebarItem';

import { ActionImgWrapper, GemImg } from './items.style';
import gem from '@app/assets/images/gem.png';

export default function LogIn() {
    const { t } = useTranslation('airdrop');
    const { handleAuth, authUrlCopied } = useAirdropAuth();

    const tooltipContent = authUrlCopied ? (
        <>
            <Typography variant="h6">{`Could not open URL`}</Typography>
            <Typography variant="p">{`It has been copied to your clipboard, please visit the link directly to log in`}</Typography>
        </>
    ) : (
        <>
            <Typography variant="h6">{t('loggedOutTitle')}</Typography>
            <Typography variant="p">{t('topTooltipText')}</Typography>
        </>
    );

    return (
        <button onClick={() => handleAuth()}>
            <SidebarItem text={t('joinAirdrop')} tooltipContent={tooltipContent}>
                <ActionImgWrapper style={{ marginBottom: '-4px' }}>
                    <GemImg src={gem} alt="gem ico" />
                </ActionImgWrapper>
            </SidebarItem>
        </button>
    );
}
