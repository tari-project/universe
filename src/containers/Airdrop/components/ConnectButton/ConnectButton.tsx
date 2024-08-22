import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { StyledButton, StyledXIcon, StyledXIconWrapper } from './styles.ts';
import { Typography } from '@mui/material';
import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/api/shell';
import { v4 as uuidv4 } from 'uuid';

export default function ConnectButton() {
    const {authUuid, setAuthUuid} = useAirdropStore();

    const handleAuth = useCallback(() => {
        const token = uuidv4() 
        setAuthUuid(token);
        open(`https://airdrop.tari.com?tari=${token}`);
    }, [setAuthUuid]);

    useEffect(() => {
        if (authUuid) {
            const interval = setInterval(() => {
                if (authUuid) {
                    console.log(`fetching authUuid: ${authUuid}`);
                    fetch(`https://airdrop.tari.com/api/auth/twitter/get-token/${authUuid}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.error) {
                                console.log(data.error);
                                return;
                            }
                            clearInterval(interval);
                            console.log(data);
                        });
                }
            }, 1000);
            const timeout = setTimeout(() => {
                clearInterval(interval);
                setAuthUuid('');
            }, 1000 * 60 * 5);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            }
        }
    }, [authUuid, setAuthUuid]);


    return (
        <StyledButton
            onClick={handleAuth}
            size="medium"
            endIcon={
                <StyledXIconWrapper>
                    <StyledXIcon />
                </StyledXIconWrapper>
            }
            sx={{
                position: 'relative',
                '& .MuiButton-endIcon': {
                    position: 'absolute',
                    right: '1em',
                },
            }}
        >
            <Typography variant="button">Log in to claim gems</Typography>
        </StyledButton>
    );
}
