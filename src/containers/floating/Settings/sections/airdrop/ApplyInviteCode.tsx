import { Button } from '@app/components/elements/buttons/Button';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import { useState, useTransition } from 'react';
import { Input } from '@app/components/elements/inputs/Input';

import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

export const ApplyInviteCode = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [claimCode, setClaimCode] = useState('');
    const [isPending, startTransition] = useTransition();

    const { handleAuth } = useAirdropAuth();

    function handleClick() {
        startTransition(async () => await handleAuth(claimCode));
    }

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('inviteCode')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <Input
                        name="apply-invite-code"
                        type="text"
                        disabled={isPending}
                        value={claimCode}
                        onChange={(event) => setClaimCode(event.target.value)}
                    />
                </SettingsGroupContent>
                <SettingsGroupAction style={{ minWidth: 200, height: 40, justifyContent: 'center' }}>
                    <Button
                        size="medium"
                        onClick={handleClick}
                        disabled={isPending}
                        fluid
                        loader={<LoadingDots />}
                        isLoading={isPending}
                    >
                        {t('applyInviteCode')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
