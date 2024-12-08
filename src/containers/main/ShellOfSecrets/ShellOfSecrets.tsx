import SoSWidget from './SoSWidget/SoSWidget';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { AnimatePresence } from 'framer-motion';
import SoSMainModal from './SoSMainModal/SoSMainModal';

export default function ShellOfSecrets() {
    const { showWidget, showMainModal } = useShellOfSecretsStore();

    return (
        <>
            <AnimatePresence>{showWidget && <SoSWidget />}</AnimatePresence>
            <AnimatePresence>{showMainModal && <SoSMainModal />}</AnimatePresence>
        </>
    );
}
