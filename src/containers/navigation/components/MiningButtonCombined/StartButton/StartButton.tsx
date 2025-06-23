import { StartWrapper, Text, IconWrapper } from './styles';
import PlayIcon from './icons/PlayIcon';
import { useTranslation } from 'react-i18next';

interface Props {
    onClick: () => void;
    disabled?: boolean;
}

export default function StartButton({ onClick, disabled = false }: Props) {
    const { t } = useTranslation('mining-view');

    return (
        <StartWrapper
            onClick={onClick}
            disabled={disabled}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <IconWrapper $absolute={true} className="play-icon">
                <PlayIcon />
            </IconWrapper>
            <Text className="start-text">{t(`mining-button-text.start-mining`)}</Text>
        </StartWrapper>
    );
}
