import {
    Wrapper,
    ActiveMinersWrapper,
    PhotoWrapper,
    PhotoImage,
    StatusDot,
    TextWrapper,
    MainText,
    LabelText,
    Divider,
    InviteFriendsMessage,
} from './styles';

import photo1 from '../../../../../images/person1.png';
import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';
import { formatNumber, FormatPreset } from '@app/utils';

export default function StatsRow() {
    const totalFriends = useCrewRewardsStore((s) => s.totalFriends);
    const activeFriends = useCrewRewardsStore((s) => s.activeFriends);
    const bonusXTMEarned = useCrewRewardsStore((s) => s.bonusXTMEarned);
    const hasFriends = totalFriends > 0;

    return (
        <Wrapper>
            {hasFriends ? (
                <ActiveMinersWrapper>
                    <PhotoWrapper>
                        <PhotoImage $image={photo1} aria-hidden="true" />
                        <PhotoImage $image={photo1} aria-hidden="true" />
                        <PhotoImage $image={photo1} aria-hidden="true" />
                        <StatusDot />
                    </PhotoWrapper>

                    <TextWrapper>
                        <MainText>
                            {activeFriends}{' '}
                            <span>
                                {`of`} {totalFriends}
                            </span>
                        </MainText>
                        <LabelText>{`Active Miners`}</LabelText>
                    </TextWrapper>
                </ActiveMinersWrapper>
            ) : (
                <InviteFriendsMessage>
                    {`Invite friends and start earning `} <strong>{`bonus XTM!`}</strong>
                </InviteFriendsMessage>
            )}

            <Divider />

            <TextWrapper>
                <MainText>{formatNumber(bonusXTMEarned, FormatPreset.XTM_LONG_DEC)}</MainText>
                <LabelText>{`Bonus XTM Earned`}</LabelText>
            </TextWrapper>
        </Wrapper>
    );
}
