import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { DashboardBanner } from './styles.ts';
import { setDialogToShow } from '@app/store';

export default function Banner() {
    function handleClick() {
        setDialogToShow('warmup');
    }
    return (
        <DashboardBanner>
            <Typography>{`TARI MAINNET IS LIVE`}</Typography>
            <Button onClick={handleClick}>{`Learn more`}</Button>
        </DashboardBanner>
    );
}
