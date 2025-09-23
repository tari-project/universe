import InviteFriendsButton from '../../../MainSection/segments/TopRow/InviteFriendsButton/InviteFriendsButton';
import { Wrapper, Title, Text, Buttons, ButtonOutline, TextWrapper } from './styles';

interface Props {
    inactiveCount?: number;
    onFilterChange: (status: 'active' | 'inactive') => void;
}

export default function CrewEmpty({ inactiveCount = 0, onFilterChange }: Props) {
    return (
        <Wrapper>
            <TextWrapper>
                <Title>Your friends are slacking!</Title>

                <Text>
                    You have <span>{inactiveCount}</span> inactive friends. Give them a nudge or invite more.
                </Text>
            </TextWrapper>

            <Buttons>
                <ButtonOutline onClick={() => onFilterChange('inactive')}>Nudge your Friends</ButtonOutline>
                <InviteFriendsButton />
            </Buttons>
        </Wrapper>
    );
}
