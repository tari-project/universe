import useWalletStore from '@app/store/walletStore.ts';
import { Typography } from '@mui/material';
import { EarningsContainer } from './Earnings.styles.ts';

export default function Earnings() {
    const balance = useWalletStore((state) => state.balance);
    return (
        <EarningsContainer>
            <Typography variant="h1">{balance}</Typography>
        </EarningsContainer>
    );
}
