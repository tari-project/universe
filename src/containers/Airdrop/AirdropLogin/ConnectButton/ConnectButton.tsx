import { useAirdropStore, UserPoints } from '@app/store/useAirdropStore.ts';
import { NumberPill, StyledButton, XIcon, IconCircle, Text, Gem1, Gem2, Gem3 } from './styles.ts';
import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/api/shell';
import { v4 as uuidv4 } from 'uuid';
import gem1Image from './images/gem-1.png';
import gem2Image from './images/gem-2.png';
import gem3Image from './images/gem-3.png';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api';
import { appConfig } from '@app/config.ts';

export default function ConnectButton() {
    const { authUuid, setAuthUuid, setAirdropTokens, setUserPoints, backendInMemoryConfig } = useAirdropStore();

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleAuth = useCallback(() => {
        if (backendInMemoryConfig?.airdropTwitterAuthUrl) {
            const token = uuidv4();
            setAuthUuid(token);
            open(`${backendInMemoryConfig?.airdropTwitterAuthUrl}?tauri=${token}`);
        }
    }, [backendInMemoryConfig?.airdropTwitterAuthUrl, setAuthUuid]);

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
                                if (data.token) {
                                    collectInstallReward(
                                        data.token,
                                        setUserPoints,
                                        backendInMemoryConfig?.airdropApiUrl || ''
                                    )
                                        .catch(console.error)
                                        .then(() => {
                                            //do nothing
                                        });
                                }
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

    if (!appConfig.displayAirdropWipUI) return null;

    return (
        <StyledButton onClick={handleAuth}>
            <Gem1 src={gem1Image} alt="" className="ConnectButton-Gem1" />
            <Gem2 src={gem2Image} alt="" className="ConnectButton-Gem2" />
            <Gem3 src={gem3Image} alt="" className="ConnectButton-Gem3" />

            <NumberPill>+200</NumberPill>

            <Text>{t('loginButton')}</Text>

            <IconCircle>
                <XIcon />
            </IconCircle>
        </StyledButton>
    );
}

interface InstallRewardResponse {
    success: boolean;
    userPoints: UserPoints | null;
}

const collectInstallReward = async (
    authToken: string,
    setUserPoints: (userPoints?: UserPoints) => void,
    airdropApiUrl: string
) => {
    try {
        const appId = await invoke('get_app_id', {});

        const result = await fetch(`${airdropApiUrl}/miner/install-reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ appId }),
        });

        const body: InstallRewardResponse = await result.json();
        if (result.status !== 200 || !body.success) {
            console.error('Error getting first install reward', body);
            return;
        }

        if (body.userPoints !== null || body.userPoints) {
            setUserPoints(body.userPoints as UserPoints);
        }
    } catch (error) {
        console.error('Error getting first install reward', error);
    }
};
