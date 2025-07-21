import LinkIcon from './LinkIcon';
import { IconWrapper, Wrapper } from './styles';

export default function InviteFriendsButton() {
    const handleClick = () => {
        console.log('Invite Friends');
    };

    return (
        <Wrapper type="button" onClick={handleClick}>
            {`Invite Friends`}
            <IconWrapper>
                <LinkIcon />
            </IconWrapper>
        </Wrapper>
    );
}
