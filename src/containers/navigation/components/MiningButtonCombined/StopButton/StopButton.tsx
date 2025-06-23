import { IconWrapper } from '../StartButton/styles';
import StopIcon from './icons/StopIcon';
import { DropdownWrapper, HitBox, StopWrapper, Text } from './styles';
import ModeDropdown from './components/ModeDropdown/ModeDropdown';
import { useState } from 'react';

interface Props {
    onClick: () => void;
}

export default function StopButton({ onClick }: Props) {
    const [selectedMode, setSelectedMode] = useState('Eco');

    return (
        <StopWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            $selectedMode={selectedMode}
        >
            <HitBox onClick={onClick}>
                <IconWrapper $absolute={false} className="stop-icon">
                    <StopIcon />
                </IconWrapper>
                <Text className="stop-text">{`Stop Mining`}</Text>
            </HitBox>
            <DropdownWrapper>
                <ModeDropdown selectedMode={selectedMode} setSelectedMode={setSelectedMode} />
            </DropdownWrapper>
        </StopWrapper>
    );
}
