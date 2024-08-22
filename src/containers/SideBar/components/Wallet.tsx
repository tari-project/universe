import { Typography, Stack } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { WalletContainer, Handle } from '../styles';
import { darkTheme } from '@app/theme/themes';
import { AddressBox, BalanceChangeChip } from '../styles';
import { FaCircleArrowUp } from 'react-icons/fa6';
import useWalletStore from '@app/store/walletStore';
import formatBalance from '@app/utils/formatBalance.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';

function Wallet() {
    const balance = useWalletStore((state) => state.balance);
    const formatted = formatBalance(balance);
    const address = '🚀⏰🎉';

    const balanceFontSize = (): number => {
        if (balance <= 100000 * 1_000_000) {
            return 45;
        } else if (balance <= 1_000_000 * 1_000_000) {
            return 35;
        } else if (balance <= 100_000_000 * 1_000_000) {
            return 30;
        } else if (balance <= 10_000_000_000 * 1_000_000) {
            return 25;
        } else {
            return 20;
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <WalletContainer>
                <Stack direction="column" spacing={0.5} alignItems="center" width="100%" height="93px">
                    <Handle />
                    <Stack direction="column" spacing={1} alignItems="flex-end" width="100%">
                        <AddressBox>{address}</AddressBox>
                    </Stack>
                </Stack>
                <Stack ml="10px">
                    <Typography variant="body2" mb={1}>
                        Wallet Balance
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="baseline"
                        justifyContent="space-between"
                        width="100%"
                    >
                        <Stack direction="row" spacing={0.2} alignItems="baseline">
                            <Typography variant="h2">
                                <CharSpinner value={formatted} variant="simple" fontSize={balanceFontSize()} />
                            </Typography>
                            <Typography variant="h4">XTM</Typography>
                        </Stack>
                        <BalanceChangeChip direction="up" icon={<FaCircleArrowUp size={20} />} label="30%" />
                    </Stack>
                </Stack>
            </WalletContainer>
        </ThemeProvider>
    );
}

export default Wallet;
