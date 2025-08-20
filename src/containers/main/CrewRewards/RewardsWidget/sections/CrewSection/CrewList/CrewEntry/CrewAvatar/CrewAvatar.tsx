import { AvatarWrapper, StatusDot } from './styles';

interface Props {
    image: string;
    isOnline: boolean;
}

export default function CrewAvatar({ image, isOnline }: Props) {
    return (
        <AvatarWrapper $isOnline={isOnline} $image={image}>
            <StatusDot />
        </AvatarWrapper>
    );
}
