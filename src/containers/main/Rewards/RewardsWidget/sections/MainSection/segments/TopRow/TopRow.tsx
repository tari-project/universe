import { IconImage, RightSide, Title, Wrapper } from './styles';
import coinImage from '../../../../../images/coin_solo.png';
import InviteFriendsButton from './InviteFriendsButton/InviteFriendsButton';
import ToggleIcon from './ToggleIcon/ToggleIcon';

export default function TopRow() {
    return (
        <Wrapper>
            <Title>
                <IconImage src={coinImage} alt="" aria-hidden="true" /> {`Rewards`}
            </Title>

            <RightSide>
                <InviteFriendsButton />
                <ToggleIcon />
            </RightSide>
        </Wrapper>
    );
}
