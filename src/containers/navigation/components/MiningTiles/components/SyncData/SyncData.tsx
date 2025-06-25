import { Label, Wrapper } from './styles.ts';
import { useProgressCountdown } from '@app/containers/main/Sync/components/useProgressCountdown.ts';

export default function SyncData() {
    const { countdownText } = useProgressCountdown();
    return (
        <Wrapper>
            <Label>{`sup`}</Label>
        </Wrapper>
    );
}
