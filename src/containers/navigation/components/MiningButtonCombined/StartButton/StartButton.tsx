import { StartWrapper, Text, IconWrapper } from './styles';
import PlayIcon from './icons/PlayIcon';
import { useTranslation } from 'react-i18next';

interface Props {
    onClick: () => void;
}

export default function StartButton({ onClick }: Props) {
    const { t } = useTranslation('mining-view');

    return (
        <StartWrapper onClick={onClick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <IconWrapper $absolute={true} className="play-icon">
                <PlayIcon />
            </IconWrapper>
            <Text className="start-text">{t(`mining-button-text.start-mining`)}</Text>
        </StartWrapper>
    );
}
