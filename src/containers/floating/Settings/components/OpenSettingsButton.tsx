import { IoSettingsOutline } from 'react-icons/io5';
import { setIsSettingsOpen } from '@app/store/actions/appStateStoreActions.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export default function OpenSettingsButton() {
    return (
        <IconButton onClick={() => setIsSettingsOpen(true)}>
            <IoSettingsOutline size={16} />
        </IconButton>
    );
}
