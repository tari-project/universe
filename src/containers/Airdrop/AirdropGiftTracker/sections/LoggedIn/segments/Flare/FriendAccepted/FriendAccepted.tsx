import { Gems, Text, Wrapper } from './styles';

interface Props {
    gems: number;
}

export default function FriendAccepted({ gems }: Props) {
    return (
        <Wrapper>
            <Gems>{gems}</Gems>
            <Text>
                Bonus gems earned <br /> One of your friends accepted your gift
            </Text>
        </Wrapper>
    );
}
