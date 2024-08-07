import { StyledButton, StyledXIcon, StyledXIconWrapper } from './styles.ts';
import { Typography } from '@mui/material';

export default function ConnectButton() {
    return (
        <StyledButton
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
