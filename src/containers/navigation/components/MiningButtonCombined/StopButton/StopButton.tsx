import { IconWrapper } from '../StartButton/styles';
import StopIcon from './icons/StopIcon';
import { DropdownWrapper, HitBox, StopWrapper, Text } from './styles';
import ModeDropdown from './components/ModeDropdown/ModeDropdown';

interface Props {
    onClick: () => void;
}

export default function StopButton({ onClick }: Props) {
    return (
        <StopWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HitBox onClick={onClick}>
                <IconWrapper $absolute={false} className="stop-icon">
                    <StopIcon />
                </IconWrapper>
                <Text className="stop-text">{`Stop Mining`}</Text>
            </HitBox>
            <DropdownWrapper>
                <ModeDropdown />
            </DropdownWrapper>
        </StopWrapper>
    );
}
