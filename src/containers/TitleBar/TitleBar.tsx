import { useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { Stack } from '@mui/material';
import { IoClose, IoRemove } from 'react-icons/io5';
import { RiExpandUpDownFill, RiContractUpDownFill } from 'react-icons/ri';
import {
  CloseButton,
  MinimizeButton,
  ToggleButton,
  MinMaxStyle,
  TitleBarContainer,
} from './styles';

const TitleBar = ({}: {}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const minimize = () => appWindow.minimize();
  const close = () => appWindow.close();
  const toggleMaximize = () => {
    setIsExpanded(!isExpanded);
    appWindow.toggleMaximize();
  };

  return (
    <TitleBarContainer data-tauri-drag-region>
      <Stack direction="row" spacing={1} pl={2} pr={2} alignItems={'center'}>
        <CloseButton onClick={close}>
          <IoClose />
        </CloseButton>
        <MinimizeButton onClick={minimize}>
          <IoRemove />
        </MinimizeButton>
        <ToggleButton onClick={toggleMaximize}>
          {isExpanded ? (
            <RiContractUpDownFill style={MinMaxStyle} />
          ) : (
            <RiExpandUpDownFill style={MinMaxStyle} />
          )}
        </ToggleButton>
      </Stack>
    </TitleBarContainer>
  );
};

export default TitleBar;
