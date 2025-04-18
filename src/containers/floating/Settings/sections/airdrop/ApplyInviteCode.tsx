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
import { useState } from 'react';
import { Input } from '@app/components/elements/inputs/Input';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useAirdropAuth } from '@app/hooks/airdrop/utils/useAirdropAuth.ts';

export const ApplyInviteCode = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [claimCode, setClaimCode] = useState('');
    const [loading, setLoading] = useState(false);

    const { handleAuth } = useAirdropAuth();

    async function handleClick() {
        setLoading(true);
        await handleAuth(claimCode);
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
                        disabled={loading}
                        value={claimCode}
                        onChange={(event) => setClaimCode(event.target.value)}
                    />
                </SettingsGroupContent>
                <SettingsGroupAction style={{ minWidth: 160, height: 40, justifyContent: 'center' }}>
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Button size="medium" onClick={handleClick} disabled={loading}>
                            {t('applyInviteCode')}
                        </Button>
                    )}
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
