import SoSWidget from './SoSWidget/SoSWidget';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { AnimatePresence } from 'motion/react';
import { memo } from 'react';

const ShellOfSecrets = memo(function ShellOfSecrets() {
    const showWidget = useShellOfSecretsStore((s) => s.showWidget);

    return <AnimatePresence>{showWidget && <SoSWidget />}</AnimatePresence>;
});
export default ShellOfSecrets;
