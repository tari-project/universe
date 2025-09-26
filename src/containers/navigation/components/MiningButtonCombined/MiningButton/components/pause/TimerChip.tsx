import { CountdownIcon } from './CountdownIcon.tsx';
import { ChipText, ChipWrapper } from './styles.ts';

interface TimerChipProps {
    resumeTime: string;
}
export default function TimerChip({ resumeTime }: TimerChipProps) {
    return (
        <ChipWrapper>
            <CountdownIcon /> <ChipText>{resumeTime}</ChipText>
        </ChipWrapper>
    );
}
