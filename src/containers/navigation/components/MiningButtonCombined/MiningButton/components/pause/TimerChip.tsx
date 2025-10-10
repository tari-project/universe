import { CountdownIcon } from './CountdownIcon.tsx';
import { ChipText, ChipWrapper } from './styles.ts';

interface TimerChipProps {
    resumeTime: { displayString?: string; fullTimeString?: string };
}
export default function TimerChip({ resumeTime }: TimerChipProps) {
    return (
        <ChipWrapper title={resumeTime.fullTimeString}>
            <CountdownIcon /> <ChipText>{resumeTime.displayString}</ChipText>
        </ChipWrapper>
    );
}
