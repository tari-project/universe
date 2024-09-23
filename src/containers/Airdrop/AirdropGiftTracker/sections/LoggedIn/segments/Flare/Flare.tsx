import BonusGems from './BonusGems/BonusGems';
import FriendAccepted from './FriendAccepted/FriendAccepted';
import GoalComplete from './GoalComplete/GoalComplete';
import { Wrapper } from './styles';

interface Props {
    gems: number;
    animationType: 'GoalComplete' | 'FriendAccepted' | 'BonusGems';
}

export default function Flare({ gems, animationType }: Props) {
    return (
        <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {animationType === 'GoalComplete' && <GoalComplete gems={gems} />}
            {animationType === 'FriendAccepted' && <FriendAccepted gems={gems} />}
            {animationType === 'BonusGems' && <BonusGems gems={gems} />}
        </Wrapper>
    );
}
