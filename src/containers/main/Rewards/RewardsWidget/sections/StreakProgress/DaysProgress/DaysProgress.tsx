import { Pill, Pills, Text, Wrapper } from './styles';

interface Props {
    current: number;
    total: number;
}

export default function DaysProgress({ current, total }: Props) {
    return (
        <Wrapper>
            <Pills>
                <Pill $isActive={true} />
                <Pill />
                <Pill />
            </Pills>
            <Text>
                {`Day`} {`${current}/${total}`}
            </Text>
        </Wrapper>
    );
}
