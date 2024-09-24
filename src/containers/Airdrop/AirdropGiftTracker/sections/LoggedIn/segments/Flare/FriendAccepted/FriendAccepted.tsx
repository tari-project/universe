import GemsAnimation from '../GemsAnimation/GemsAnimation';
import { Background, Number, Text, TextBottom, TextBottomPosition, Wrapper } from './styles';

interface Props {
    gems: number;
}

export default function FriendAccepted({ gems }: Props) {
    return (
        <Wrapper>
            <Number
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.5 }}
            >
                {gems.toLocaleString()}
            </Number>

            <Text
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.85 }}
            >
                Bonus gems earned
            </Text>

            <TextBottomPosition>
                <TextBottom
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 1 }}
                >
                    One of your friends accepted your gift
                </TextBottom>
            </TextBottomPosition>

            <GemsAnimation delay={1} />

            <Background
                initial={{ scale: 3 }}
                animate={{ scale: 1 }}
                exit={{ scale: 3 }}
                transition={{ duration: 0.5, ease: 'easeIn' }}
            />
        </Wrapper>
    );
}
