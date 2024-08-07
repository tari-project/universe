import { StyledButton, StyledXIcon, StyledXIconWrapper } from './styles.ts';
import { Typography } from '@mui/material';
import { useCallback } from 'react';
import { WebviewWindow } from '@tauri-apps/api/window';

export default function ConnectButton() {
    const handleAuth = useCallback(() => {
        return new WebviewWindow('window', {
            label: 'airdrop-site',
            title: 'tari-airdrop',
            url: 'https://rwa-fe.yat.rip/',
        });
    }, []);

    return (
        <StyledButton
            onClick={handleAuth}
            endIcon={
                <StyledXIconWrapper>
                    <StyledXIcon />
                </StyledXIconWrapper>
            }
            sx={{
                height: 42,
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
