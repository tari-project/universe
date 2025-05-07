import { useAirdropStore } from '@app/store';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';
import { XIconSVG } from '@app/assets/icons/x-icon.tsx';
import { ActionButton, ActionContentWrapper, ButtonIconWrapper } from './actions.style.ts';
import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';

export default function AirdropLogin() {
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    const { handleAuth } = useAirdropAuth();

    const action = (
        <ActionButton onClick={() => handleAuth()}>
            <ButtonIconWrapper>
                <XIconSVG />
            </ButtonIconWrapper>
            <ActionContentWrapper>{`Connect X Account`}</ActionContentWrapper>
        </ActionButton>
    );
    return !airdropToken ? (
        <SyncActionCard
            action={action}
            title={'Earn gems'}
            subtitle={'Connect your social account to constantly earn gems as you mine.'}
        />
    ) : null;
}
