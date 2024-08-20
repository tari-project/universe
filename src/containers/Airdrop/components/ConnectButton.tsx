import { StyledButton, StyledXIcon, StyledXIconWrapper } from './styles.ts';
import { Typography } from '@mui/material';
import { useCallback } from 'react';
import { WebviewWindow } from '@tauri-apps/api/window';

export default function ConnectButton() {
    const handleAuth = useCallback(() => {
        const vw = new WebviewWindow('window', {
            title: 'tari-airdrop',
            url: 'http:/localhost:4000?minerId=hiiiiii',
        });
        vw.once('logged_in', (r) => {
            console.log(r);
        }).then((b) => {
            console.log(b);
        });
    }, []);

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
