import { AvatarWrapper, AvatarImage, StatusDot } from './styles';

interface Props {
    image: string;
    status: 'online' | 'offline';
}

export default function CrewAvatar({ image, status }: Props) {
    return (
        <AvatarWrapper $status={status}>
            <AvatarImage src={image} alt="crew avatar" />
            <StatusDot />
        </AvatarWrapper>
    );
}
