import { StartWrapper, Text, IconWrapper } from './styles';
import PlayIcon from './icons/PlayIcon';

interface Props {
    onClick: () => void;
}

export default function StartButton({ onClick }: Props) {
    return (
        <StartWrapper onClick={onClick}>
            <IconWrapper $absolute={true}>
                <PlayIcon />
            </IconWrapper>
            <Text>{`Start Mining`}</Text>
        </StartWrapper>
    );
}
