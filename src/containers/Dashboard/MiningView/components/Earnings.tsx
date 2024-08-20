import useWalletStore from '@app/store/walletStore.ts';
import { Typography } from '@mui/material';
import { EarningsContainer } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';

export default function Earnings() {
    const balance = useWalletStore((state) => state.balance);
    const previousBalance = useWalletStore((state) => state.previousBalance);
    const earnings = balance - previousBalance;

    return (
        <EarningsContainer>
            <Typography
                variant="h1"
                sx={{
                    fontFamily: '"DrukWideLCGBold", sans-serif',
                    fontSize: '60px',
                    lineHeight: '1.1',
                }}
            >
                {formatBalance(earnings)}
            </Typography>
        </EarningsContainer>
    );
}
