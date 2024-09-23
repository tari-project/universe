import { Gems, Text, Wrapper } from './styles';

interface Props {
    gems: number;
}

export default function BonusGems({ gems }: Props) {
    return (
        <Wrapper>
            <Gems>{gems}</Gems>
            <Text>
                Bonus gems earned <br /> Keep mining to earn more rewards!
            </Text>
        </Wrapper>
    );
}
