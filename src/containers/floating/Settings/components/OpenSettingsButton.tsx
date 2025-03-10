import { IoSettingsOutline } from 'react-icons/io5';
import { setIsSettingsOpen } from '@app/store/actions/appStateStoreActions.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { ButtonSize } from '@app/components/elements/buttons/button.types.ts';

export default function OpenSettingsButton({ size, iconSize = 16 }: { iconSize?: number; size?: ButtonSize }) {
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
