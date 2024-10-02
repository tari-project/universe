import { WonBlockItem } from '@app/types/balance.ts';
import { HistoryContainer } from '@app/containers/SideBar/components/Wallet/Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import HistoryItem from '@app/containers/SideBar/components/Wallet/HistoryItem.tsx';

const mockItems: WonBlockItem[] = [
    {
        earnings: 13475,
        solvedBlock: 12085,
    },
    {
        earnings: 13475,
        solvedBlock: 11925,
    },
    {
        earnings: 345,
        solvedBlock: 10991,
    },
    {
        earnings: 13475,
        solvedBlock: 10695,
    },
    {
        earnings: 14475,
        solvedBlock: 9040,
    },
    {
        earnings: 3475,
        solvedBlock: 8011,
    },
    {
        earnings: 13475,
        solvedBlock: 6245,
    },
    {
        earnings: 475,
        solvedBlock: 5573,
    },
    {
        earnings: 2475,
        solvedBlock: 3251,
    },
    {
        earnings: 175,
        solvedBlock: 2243,
    },
    {
        earnings: 13475,
        solvedBlock: 2045,
    },
];

const container = {
    hidden: { opacity: 1, height: 0 },
    visible: {
        height: 'auto',
        opacity: 1,
        transition: {
            delayChildren: 0.1,
            staggerChildren: 0.05,
            ease: 'easeIn',
            duration: 0.2,
        },
    },
};

export default function History() {
    return (
        <HistoryContainer initial="hidden" animate="visible" exit="hidden" variants={container}>
            <Typography variant="h6">Recent wins</Typography>
            {mockItems.map((item, i) => {
                const base = new Date();
                const time = new Date(base.getTime() - 324783 - (((i / 0.3) * 60) / 0.15) * 1000 * 24 * 60); // super random temp dates
                return <HistoryItem key={i} item={{ ...item, time }} />;
            })}
        </HistoryContainer>
    );
}
