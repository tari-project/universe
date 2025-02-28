import { IoSettingsOutline } from 'react-icons/io5';

import { useAppStateStore } from '@app/store/appStateStore';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { ButtonSize } from '@app/components/elements/buttons/button.types.ts';

export default function OpenSettingsButton({ size, iconSize = 16 }: { iconSize?: number; size?: ButtonSize }) {
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);
    function handleClick(e) {
        e.stopPropagation();
        setIsSettingsOpen(true);
    }
    return (
        <IconButton onClick={handleClick} size={size}>
            <IoSettingsOutline size={iconSize} />
        </IconButton>
    );
}
