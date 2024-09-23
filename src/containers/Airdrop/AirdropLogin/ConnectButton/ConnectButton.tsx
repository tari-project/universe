import { useAirdropStore, INSTALL_BONUS_GEMS } from '@app/store/useAirdropStore.ts';
import { NumberPill, StyledButton, XIcon, IconCircle, Text, Gem1, Gem2, Gem3 } from './styles.ts';
import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/api/shell';
import { v4 as uuidv4 } from 'uuid';
import gem1Image from './images/gem-1.png';
import gem2Image from './images/gem-2.png';
import gem3Image from './images/gem-3.png';
import { useTranslation } from 'react-i18next';

export default function ConnectButton() {
    const { authUuid, setAuthUuid, setAirdropTokens, setUserPoints, backendInMemoryConfig, wipUI } = useAirdropStore();

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleAuth = useCallback(() => {
        const token = uuidv4();
        if (backendInMemoryConfig?.airdropUrl) {
            setAuthUuid(token);
            open(`${backendInMemoryConfig?.airdropUrl}/auth?tauri=${token}`);
        }
    }, [backendInMemoryConfig?.airdropUrl, setAuthUuid]);

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

    if (!wipUI) return null;

    return (
        <StyledButton onClick={handleAuth}>
            <Gem1 src={gem1Image} alt="" className="ConnectButton-Gem1" />
            <Gem2 src={gem2Image} alt="" className="ConnectButton-Gem2" />
            <Gem3 src={gem3Image} alt="" className="ConnectButton-Gem3" />

            <NumberPill>+{INSTALL_BONUS_GEMS}</NumberPill>

            <Text>{t('loginButton')}</Text>

            <IconCircle>
                <XIcon />
            </IconCircle>
        </StyledButton>
    );
}
