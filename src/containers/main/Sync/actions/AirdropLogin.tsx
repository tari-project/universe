import { useAirdropStore } from '@app/store';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';
import { XIconSVG } from '@app/assets/icons/x-icon.tsx';
import { ActionButton, ActionContentWrapper, ButtonIconWrapper } from './actions.style.ts';
import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';
import { useTranslation } from 'react-i18next';

export default function AirdropLogin() {
    const { t } = useTranslation('setup-view');
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    const { handleAuth } = useAirdropAuth();

    const action = (
        <ActionButton onClick={() => handleAuth()}>
            <ButtonIconWrapper>
                <XIconSVG />
            </ButtonIconWrapper>
            <ActionContentWrapper>{t('actions.earn-gems-cta')}</ActionContentWrapper>
        </ActionButton>
    );
    return !airdropToken ? (
        <SyncActionCard action={action} title={t('actions.earn-gems')} subtitle={t('actions.earn-gems-copy')} />
    ) : null;
}
