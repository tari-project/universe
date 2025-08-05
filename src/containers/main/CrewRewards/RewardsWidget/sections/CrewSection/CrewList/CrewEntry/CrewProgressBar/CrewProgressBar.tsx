import { Wrapper, ProgressPercent, ProgressBar } from './styles';

interface Props {
    progress: number;
}

export default function CrewProgressBar({ progress }: Props) {
    return (
        <Wrapper>
            <ProgressPercent>{progress.toFixed(2)}%</ProgressPercent>
            <ProgressBar $progress={progress} />
        </Wrapper>
    );
}
