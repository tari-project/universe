import { useTranslation } from 'react-i18next';

import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SidebarItem } from './components/SidebarItem';

import { ActionImgWrapper, GemImgLarge } from './items.style';
import gem from '@app/assets/images/gem.png';

export default function LogIn() {
    const { t } = useTranslation('airdrop');
    const { handleAuth, authUrlCopied } = useAirdropAuth();

    const tooltipContent = authUrlCopied ? (
        <>
            <Typography variant="h6">{t('auth.url-error')}</Typography>
            <Typography variant="p">{t('auth.url-error-copy')}</Typography>
        </>
    ) : (
        <>
            <Typography variant="h6">{t('loggedOutTitle')}</Typography>
            <Typography variant="p">{t('topTooltipText')}</Typography>
        </>
    );

    return (
        <button onClick={() => handleAuth()} style={{ borderRadius: 10 }}>
            <SidebarItem text={t('earnBonusXTM')} tooltipContent={tooltipContent}>
                <ActionImgWrapper style={{ marginBottom: '-4px' }}>
                    <GemImgLarge src={gem} alt="gem ico" />
                </ActionImgWrapper>
            </SidebarItem>
        </button>
    );
}
