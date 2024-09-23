import { Gems, Text, Wrapper } from './styles';

interface Props {
    gems: number;
}

export default function GoalComplete({ gems }: Props) {
    return (
        <Wrapper>
            <Gems>{gems}</Gems>
            <Text>
                Bonus gems earned <br /> You reached your gifting goal!{' '}
            </Text>
        </Wrapper>
    );
}
