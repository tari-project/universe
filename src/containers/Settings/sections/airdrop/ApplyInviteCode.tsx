import { SettingsGroupContent, SettingsGroupTitle, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';
import { Typography } from '@app/components/elements/Typography';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@app/components/elements/inputs/Input';
import { Button } from '@app/components/elements/Button';
import { v4 as uuidv4 } from 'uuid';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { Stack } from '@app/components/elements/Stack';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export const ApplyInviteCode = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);

    const [claimCode, setClaimCode] = useState('');

    const { authUuid, setAuthUuid, setAirdropTokens, setUserPoints, backendInMemoryConfig } = useAirdropStore();

    const handleAuth = useCallback(
        (code?: string) => {
            const token = uuidv4();
            if (backendInMemoryConfig?.airdropTwitterAuthUrl) {
                setAuthUuid(token);
                setAllowTelemetry(true);

                open(
                    `${backendInMemoryConfig?.airdropTwitterAuthUrl}?tauri=${token}${code ? `&universeReferral=${code}` : ''}`
                );
            }
        },
        [backendInMemoryConfig?.airdropTwitterAuthUrl, setAllowTelemetry, setAuthUuid]
    );

    useEffect(() => {
        if (authUuid && backendInMemoryConfig?.airdropApiUrl) {
            const interval = setInterval(() => {
                if (authUuid) {
                    fetch(`${backendInMemoryConfig?.airdropApiUrl}/auth/twitter/get-token/${authUuid}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (!data.error) {
                                clearInterval(interval);
                                setAirdropTokens(data);
                            }
                        });
                }
            }, 1000);
            const timeout = setTimeout(
                () => {
                    clearInterval(interval);
                    setAuthUuid('');
                },
                1000 * 60 * 5
            );

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [authUuid, backendInMemoryConfig?.airdropApiUrl, setAirdropTokens, setAuthUuid, setUserPoints]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('inviteCode')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroupContent>
                <Stack direction="row" gap={4} justifyContent="flex-start">
                    <Input
                        name="apply-invite-code"
                        patternType="text"
                        value={claimCode}
                        onChange={(event) => setClaimCode(event.target.value)}
                        style={{ maxWidth: '20rem' }}
                    ></Input>
                    <Button color="error" variant="text" size="medium" onClick={() => handleAuth(claimCode)}>
                        {t('applyInviteCode')}
                    </Button>
                </Stack>
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
};
