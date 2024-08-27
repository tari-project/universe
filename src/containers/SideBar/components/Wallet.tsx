import { Typography, Stack } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { WalletContainer, Handle } from '../styles';
import { darkTheme } from '@app/theme/themes';
import useWalletStore from '@app/store/walletStore';
import formatBalance from '@app/utils/formatBalance.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { WalletBalance } from './Wallet.styles.ts';

function Wallet() {
    const balance = useWalletStore((state) => state.balance);
    const formatted = formatBalance(balance);
    const balanceFontSize = formatted.length <= 6 ? 60 : formatted.length <= 8 ? 44 : 32;

    return (
        <ThemeProvider theme={darkTheme}>
            <WalletContainer>
                <Stack direction="column" spacing={0.5} alignItems="center" width="100%" height="93px">
                    <Handle />
                </Stack>
                <Typography variant="body2">Wallet Balance</Typography>
                <WalletBalance>
                    <CharSpinner value={formatted} variant="simple" fontSize={balanceFontSize} />
                </WalletBalance>
            </WalletContainer>
        </ThemeProvider>
    );
}

export default Wallet;
