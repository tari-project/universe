import { Wrapper, FriendsWrapper, Friend, Text, FriendCount, PositionArrows } from './styles';

import friendImage1 from '../../images/friend1.png';
import friendImage2 from '../../images/friend2.png';
import friendImage3 from '../../images/friend3.png';

import AnimatedArrows from './AnimatedArrows/AnimatedArrows';
import { useTranslation } from 'react-i18next';
import GrowCrew from './GrowCrew/GrowCrew';

export default function Friends() {
    const { t } = useTranslation('sos', { useSuspense: false });

    return (
        <Wrapper>
            <FriendsWrapper>
                <Friend $image={friendImage1} alt="" />
                <Friend $image={friendImage2} alt="" />
                <Friend $image={friendImage3} alt="" />
                <FriendCount>+14</FriendCount>
            </FriendsWrapper>

            <Text>{t('widget.friends.reduceTimer')}</Text>

            <GrowCrew />

            <PositionArrows>
                <AnimatedArrows />
            </PositionArrows>
        </Wrapper>
    );
}
