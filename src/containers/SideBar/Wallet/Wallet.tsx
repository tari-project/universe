import { Typography, Stack } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { WalletContainer } from './styles';
import { darkTheme } from '../../../theme/themes';
import useAppStateStore from '../../../store/appStateStore';

function Wallet() {
  const { wallet } = useAppStateStore();
  return (
    <ThemeProvider theme={darkTheme}>
      <WalletContainer>
        <Typography variant="body2">Wallet Balance</Typography>

        <Stack direction="row" spacing={0.5} alignItems="baseline">
          <Typography variant="h2">{wallet.balance}</Typography>
          <Typography variant="h6">XTM</Typography>
        </Stack>
      </WalletContainer>
    </ThemeProvider>
  );
}

export default Wallet;
