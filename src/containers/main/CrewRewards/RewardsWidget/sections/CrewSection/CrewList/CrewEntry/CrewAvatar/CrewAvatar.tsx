import Avatar from '@app/components/elements/Avatar/Avatar';
import { AvatarWrapper, StatusDot } from './styles';

interface Props {
    image: string;
    isOnline: boolean;
}

export default function CrewAvatar({ image, isOnline }: Props) {
    return (
        <AvatarWrapper $isOnline={isOnline}>
            <StatusDot />
            <Avatar image={image} username={''} key={image} size={40} />
        </AvatarWrapper>
    );
}
