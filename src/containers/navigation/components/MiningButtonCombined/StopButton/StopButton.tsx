import { HitBox, StopWrapper, Text } from './styles';

interface Props {
    onClick: () => void;
}

export default function StopButton({ onClick }: Props) {
    return (
        <StopWrapper>
            <HitBox onClick={onClick}>
                <Text>{`Stop Mining`}</Text>
            </HitBox>
        </StopWrapper>
    );
}
