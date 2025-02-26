import { IoSettingsOutline } from 'react-icons/io5';

import { useAppStateStore } from '@app/store/appStateStore';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export default function OpenSettingsButton({ iconSize = 16 }: { iconSize?: number }) {
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);
    function handleClick(e) {
        e.stopPropagation();
        setIsSettingsOpen(true);
    }
    return (
        <IconButton onClick={handleClick}>
            <IoSettingsOutline size={iconSize} />
        </IconButton>
    );
}
