import { useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { IoClose, IoRemove } from 'react-icons/io5';
import { RiExpandUpDownFill, RiContractUpDownFill } from 'react-icons/ri';
import { CloseButton, MinimizeButton, ToggleButton, TitleBarContainer } from './styles';
import { Stack } from '@app/components/elements/Stack';

const TitleBar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const minimize = () => appWindow.minimize();
    const close = () => appWindow.close();
    const toggleMaximize = () => {
        setIsExpanded(!isExpanded);
        appWindow.toggleMaximize();
    };

    return (
        <TitleBarContainer data-tauri-drag-region>
            <Stack>
                <CloseButton onClick={close}>
                    <IoClose />
                </CloseButton>
                <MinimizeButton onClick={minimize}>
                    <IoRemove />
                </MinimizeButton>
                <ToggleButton onClick={toggleMaximize}>
                    {isExpanded ? <RiContractUpDownFill /> : <RiExpandUpDownFill />}
                </ToggleButton>
            </Stack>
        </TitleBarContainer>
    );
};

export default TitleBar;
