import { useTranslation } from 'react-i18next';

import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SidebarItem } from './components/SidebarItem';

import { ActionImgWrapper, GemImgLarge } from './items.style';
import gem from '@app/assets/images/gem.png';
import { useAirdropStore } from '@app/store';
import { FEATURE_FLAGS as FF } from '@app/store/consts.ts';
import { ParachuteSVG } from '@app/assets/icons/ParachuteSVG.tsx';

export default function LogIn() {
    const { t } = useTranslation('airdrop');
    const { handleAuth, authUrlCopied } = useAirdropAuth();
    const ff = useAirdropStore((s) => s.features);
    const claimEnabled = !ff?.includes(FF.FF_AD_KS) && ff?.includes(FF.FF_AD_CLAIM_ENABLED);

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
    const oldMarkup = (
        <SidebarItem text={t('earnBonusXTM')} tooltipContent={tooltipContent} isWrapped>
            <ActionImgWrapper style={{ marginBottom: '-4px' }}>
                <GemImgLarge src={gem} alt="gem ico" />
            </ActionImgWrapper>
        </SidebarItem>
    );
    const claimMarkup = (
        <SidebarItem isWrapped text={t('login')}>
            <ActionImgWrapper style={{ marginBottom: '-4px' }}>
                {claimEnabled ? <ParachuteSVG /> : <GemImgLarge src={gem} alt="gem ico" />}
            </ActionImgWrapper>
        </SidebarItem>
    );

    return (
        <button onClick={() => handleAuth()} style={{ borderRadius: 10 }}>
            {claimEnabled ? claimMarkup : oldMarkup}
        </button>
    );
}
