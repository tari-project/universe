import { useAirdropStore } from '@app/store';
import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';
import { Button } from '@app/components/elements/buttons/Button';
import { XIconSVG } from '@app/assets/icons/x-icon.tsx';
import { ButtonIconWrapper } from '@app/containers/main/Sync/actions/actions.style.ts';
import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';

export default function AirdropLogin() {
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    const { handleAuth } = useAirdropAuth();

    const action = (
        <Button
            icon={
                <ButtonIconWrapper>
                    <XIconSVG />
                </ButtonIconWrapper>
            }
            backgroundColor="grey"
            iconPosition="start"
            onClick={() => handleAuth()}
        >
            {`Connect X account`}
        </Button>
    );
    return !airdropToken ? (
        <SyncActionCard
            action={action}
            title={'Earn gems'}
            subtitle={'Connect your social account to constantly earn gems as you mine.'}
        />
    ) : null;
}
