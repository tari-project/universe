import { StartWrapper, Text, IconWrapper } from './styles';
import PlayIcon from './icons/PlayIcon';

interface Props {
    onClick: () => void;
}

export default function StartButton({ onClick }: Props) {
    return (
        <StartWrapper onClick={onClick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <IconWrapper $absolute={true} className="play-icon">
                <PlayIcon />
            </IconWrapper>
            <Text className="start-text">{`Start Mining`}</Text>
        </StartWrapper>
    );
}
