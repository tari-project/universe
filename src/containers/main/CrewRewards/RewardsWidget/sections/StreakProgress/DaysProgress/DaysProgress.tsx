import { Pill, Pills, Text, Wrapper } from './styles';

interface Props {
    current: number;
    total: number;
}

export default function DaysProgress({ current, total }: Props) {
    return (
        <Wrapper>
            <Pills>
                <Pill $isActive={current >= 1} />
                <Pill $isActive={current >= 2} />
                <Pill $isActive={current >= 3} />
            </Pills>
            <Text>
                {`Day`} {`${current}/${total}`}
            </Text>
        </Wrapper>
    );
}
