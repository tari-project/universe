import { BackgroundImage } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';
function AppBackground() {
    const visualMode = useUIStore((s) => s.visualMode);
    const view = useUIStore((s) => s.view);

    return !visualMode || view === 'setup' ? <BackgroundImage /> : null;
}

export default AppBackground;
