import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { NumberPill, StyledButton, XIcon, IconCircle, Text, Gem1, Gem2, Gem3 } from './styles.ts';
import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/api/shell';
import { v4 as uuidv4 } from 'uuid';
import gem1Image from './images/gem-1.png';
import gem2Image from './images/gem-2.png';
import gem3Image from './images/gem-3.png';

export default function ConnectButton() {
    const { authUuid, setAuthUuid, setAirdropTokens } = useAirdropStore();

    const handleAuth = useCallback(() => {
        const token = uuidv4();
        setAuthUuid(token);
        open(`https://airdrop.tari.com?tari=${token}`);
    }, [setAuthUuid]);

    useEffect(() => {
        if (authUuid) {
            const interval = setInterval(() => {
                if (authUuid) {
                    fetch(`https://airdrop.tari.com/api/auth/twitter/get-token/${authUuid}`, {
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
    }, [authUuid, setAirdropTokens, setAuthUuid]);

    return (
        <StyledButton onClick={handleAuth} size="medium">
            <Gem1 src={gem1Image} alt="" className="ConnectButton-Gem1" />
            <Gem2 src={gem2Image} alt="" className="ConnectButton-Gem2" />
            <Gem3 src={gem3Image} alt="" className="ConnectButton-Gem3" />

            <NumberPill>+200</NumberPill>
            <Text>Log in to claim gems</Text>
            <IconCircle>
                <XIcon />
            </IconCircle>
        </StyledButton>
    );
}
