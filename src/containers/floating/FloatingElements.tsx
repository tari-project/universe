import { FloatingTree } from '@floating-ui/react';

import SettingsModal from './Settings/SettingsModal.tsx';
import StagedSecurity from './StagedSecurity/StagedSecurity.tsx';
import AutoUpdateDialog from './AutoUpdateDialog/AutoUpdateDialog.tsx';
import ExternalDependenciesDialog from './ExternalDependenciesDialog/ExternalDependenciesDialog.tsx';
import CriticalErrorDialog from './CriticalErrorDialog/CriticalErrorDialog.tsx';
import PaperWalletModal from './PaperWalletModal/PaperWalletModal.tsx';
import ShareRewardModal from './ShareRewardModal/ShareRewardModal';
import AdminUI from '@app/components/AdminUI/AdminUI.tsx';
import ToastStack from '@app/components/ToastStack/ToastStack.tsx';
import CriticalProblemDialog from './CriticalProblemDialog/CriticalProblemDialog.tsx';
import ShellOfSecrets from '../main/ShellOfSecrets/ShellOfSecrets.tsx';
import ReleaseNotesDialog from './ReleaseNotesDialog/ReleaseNotesDialog.tsx';
import LudicrousCofirmationDialog from './LudicrousCofirmationDialog/LudicrousCofirmationDialog.tsx';
import TappletTransactionDialog from './TappletTransactionDialog/TappletTransactionDialog.tsx';
import { memo } from 'react';

const environment = import.meta.env.MODE;

const FloatingElements = memo(function FloatingElements() {
    return (
        <FloatingTree>
            <SettingsModal />
            <StagedSecurity />
            <AutoUpdateDialog />
            <CriticalErrorDialog />
            <ExternalDependenciesDialog />
            <PaperWalletModal />
            <LudicrousCofirmationDialog />
            <ShareRewardModal />
            <ShellOfSecrets />
            <ToastStack />
            <CriticalProblemDialog />
            <ReleaseNotesDialog />
            <TappletTransactionDialog />
            {environment === 'development' && <AdminUI />}
        </FloatingTree>
    );
});

export default FloatingElements;
