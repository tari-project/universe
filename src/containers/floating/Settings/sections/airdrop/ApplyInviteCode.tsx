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
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@app/components/elements/inputs/Input';

import { v4 as uuidv4 } from 'uuid';
import { useAirdropStore } from '@app/store/useAirdropStore';

import { open } from '@tauri-apps/plugin-shell';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { setAirdropTokens, setAllowTelemetry, setAuthUuid, setFlareAnimationType } from '@app/store';

export const ApplyInviteCode = () => {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const [claimCode, setClaimCode] = useState('');
    const [loading, setLoading] = useState(false);

    const { authUuid, backendInMemoryConfig } = useAirdropStore((s) => ({
        authUuid: s.authUuid,
        backendInMemoryConfig: s.backendInMemoryConfig,
    }));

    const handleAuth = useCallback(() => {
        const token = uuidv4();
        if (backendInMemoryConfig?.airdropUrl) {
            setLoading(true);
            const refUrl = `${backendInMemoryConfig?.airdropUrl}/auth?tauri=${token}${claimCode ? `&universeReferral=${claimCode}` : ''}`;

            setAllowTelemetry(true).then(() => {
                setAuthUuid(token);
                void open(refUrl);
            });
        }
    }, [backendInMemoryConfig?.airdropUrl, claimCode]);

    const handleToken = useCallback(() => {
        if (authUuid) {
            fetch(`${backendInMemoryConfig?.airdropApiUrl}/auth/get-token/${authUuid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.error) {
                        setAirdropTokens(data)
                            .then(() => {
                                if (data.installReward) {
                                    setFlareAnimationType('FriendAccepted');
                                }
                                return true;
                            })
                            .catch(() => {
                                return false;
                            });
                    }
                })
                .catch((e) => {
                    console.error('Backend memory config error:', e);
                    return false;
                });

            return false;
        }
    }, [authUuid, backendInMemoryConfig?.airdropApiUrl]);

    useEffect(() => {
        if (authUuid && backendInMemoryConfig?.airdropApiUrl) {
            const interval = setInterval(() => {
                const canClear = handleToken();
                if (canClear) {
                    clearInterval(interval);
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
                setLoading(false);
            };
        }
    }, [authUuid, backendInMemoryConfig?.airdropApiUrl, handleToken]);

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
