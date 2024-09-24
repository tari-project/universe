import BonusGems from './BonusGems/BonusGems';
import FriendAccepted from './FriendAccepted/FriendAccepted';
import GoalComplete from './GoalComplete/GoalComplete';
import { Wrapper } from './styles';

interface Props {
    gems: number;
    animationType: 'GoalComplete' | 'FriendAccepted' | 'BonusGems';
    onAnimationComplete: () => void;
    onClick: () => void;
}

export default function Flare({ gems, animationType, onAnimationComplete, onClick }: Props) {
    return (
        <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClick}>
            {animationType === 'GoalComplete' && <GoalComplete gems={gems} onAnimationComplete={onAnimationComplete} />}

            {animationType === 'FriendAccepted' && (
                <FriendAccepted gems={gems} onAnimationComplete={onAnimationComplete} />
            )}

            {animationType === 'BonusGems' && <BonusGems gems={gems} onAnimationComplete={onAnimationComplete} />}
        </Wrapper>
    );
}
