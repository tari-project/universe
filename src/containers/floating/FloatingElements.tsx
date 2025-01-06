import { FloatingTree } from '@floating-ui/react';

import SettingsModal from './Settings/SettingsModal.tsx';
import StagedSecurity from './StagedSecurity/StagedSecurity.tsx';
import AutoUpdateDialog from './AutoUpdateDialog/AutoUpdateDialog.tsx';
import { ExternalDependenciesDialog } from './ExternalDependenciesDialog/ExternalDependenciesDialog.tsx';
import CriticalErrorDialog from './CriticalErrorDialog/CriticalErrorDialog.tsx';
import PaperWalletModal from './PaperWalletModal/PaperWalletModal.tsx';
import ShareRewardModal from './ShareRewardModal/ShareRewardModal';
import AdminUI from '@app/components/AdminUI/AdminUI.tsx';
import { ToastStack } from '@app/components/ToastStack/ToastStack.tsx';
import { CriticalProblemDialog } from './CriticalProblemDialog/CriticalProblemDialog.tsx';
import ShellOfSecrets from '../main/ShellOfSecrets/ShellOfSecrets.tsx';
import PowerLevelResetDialog from './PowerLevelResetDialog/PowerLevelResetDialog.tsx';

const environment = import.meta.env.MODE;

export default function FloatingElements() {
    return (
        <FloatingTree>
            <SettingsModal />
            <StagedSecurity />
            <AutoUpdateDialog />
            <CriticalErrorDialog />
            <ExternalDependenciesDialog />
            <PaperWalletModal />
            <PowerLevelResetDialog />
            <ShareRewardModal />
            <ShellOfSecrets />
            <ToastStack />
            <CriticalProblemDialog />
            {environment === 'development' && <AdminUI />}
        </FloatingTree>
    );
}
