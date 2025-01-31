import SoSWidget from './SoSWidget/SoSWidget';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { AnimatePresence } from 'motion';

export default function ShellOfSecrets() {
    const { showWidget } = useShellOfSecretsStore();

    return (
        <>
            <AnimatePresence>{showWidget && <SoSWidget />}</AnimatePresence>
        </>
    );
}
