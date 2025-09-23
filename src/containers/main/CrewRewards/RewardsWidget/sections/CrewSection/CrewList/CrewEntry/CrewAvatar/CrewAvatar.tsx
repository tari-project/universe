import Avatar from '@app/components/elements/Avatar/Avatar';
import { AvatarWrapper, StatusDot } from './styles';

interface Props {
    image: string;
    isOnline: boolean;
    username: string;
}

export default function CrewAvatar({ image, username, isOnline }: Props) {
    return (
        <AvatarWrapper $isOnline={isOnline}>
            <StatusDot />
            <Avatar image={image} username={username} key={image} size={39} />
        </AvatarWrapper>
    );
}
