import { AnimatePresence } from 'motion/react';
import SoSWidget from './SoSWidget/SoSWidget';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';

export default function ShellOfSecrets() {
    const showWidget = useShellOfSecretsStore((s) => s.showWidget);
    return <AnimatePresence>{showWidget && <SoSWidget />}</AnimatePresence>;
}
