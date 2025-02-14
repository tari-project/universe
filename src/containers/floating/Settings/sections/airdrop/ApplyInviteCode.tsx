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
import { useCallback, useState } from 'react';
import { Input } from '@app/components/elements/inputs/Input';

import { v4 as uuidv4 } from 'uuid';
import { useAirdropStore } from '@app/store/useAirdropStore';

import { open } from '@tauri-apps/plugin-shell';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { setAllowTelemetry, setAuthUuid, useAppConfigStore } from '@app/store';
import useFetchAirdropToken from '@app/hooks/airdrop/stateHelpers/useFetchAirdropToken.ts';

export const ApplyInviteCode = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [linkOpened, setLinkOpened] = useState(false);
    const [claimCode, setClaimCode] = useState('');
    const [loading, setLoading] = useState(false);

    useFetchAirdropToken({ canListen: linkOpened });
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const airdropUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropUrl);

    const handleAuth = useCallback(async () => {
        const token = uuidv4();
        if (airdropUrl) {
            setLoading(true);
            const refUrl = `${airdropUrl}/auth?tauri=${token}${claimCode ? `&universeReferral=${claimCode}` : ''}`;
            if (!allowTelemetry) {
                await setAllowTelemetry(true);
            }
            setAuthUuid(token);
            open(refUrl).then(() => {
                setLinkOpened(true);
            });
        }
    }, [allowTelemetry, airdropUrl, claimCode]);

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
                        <Button size="medium" onClick={() => handleAuth()} disabled={loading}>
                            {t('applyInviteCode')}
                        </Button>
                    )}
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
