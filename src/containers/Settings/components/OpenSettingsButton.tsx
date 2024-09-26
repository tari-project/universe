import { IoSettingsOutline } from 'react-icons/io5';
import { IconButton } from '@app/components/elements/Button.tsx';
import { useAppStateStore } from '@app/store/appStateStore';

export default function OpenSettingsButton() {
    const setIsSettingsOpen = useAppStateStore((s) => s.setIsSettingsOpen);

    return (
        <IconButton onClick={() => setIsSettingsOpen(true)}>
            <IoSettingsOutline size={16} />
        </IconButton>
    );
}
