import { memo } from 'react';
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

import ResumeApplicationModal from './ResumeApplicationModal/ResumeApplicationModal.tsx';
import XSpaceEventBanner from './XSpaceBanner/XSpaceBanner.tsx';
import { CustomPowerLevelsDialogContainer } from '@app/containers/navigation/components/Miner/components/CustomPowerLevels/CustomPowerLevelsDialogContainer.tsx';
import WarmupDialog from './Warmup/WarmupDialog.tsx';
import EXModal from '@app/containers/floating/EXModal/EXModal.tsx';

const environment = import.meta.env.MODE;

const FloatingElements = memo(function FloatingElements() {
    return (
        <FloatingTree>
            {environment === 'development' && <AdminUI />}
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
            <XSpaceEventBanner />
            <CustomPowerLevelsDialogContainer />
            <WarmupDialog />
            <EXModal />
            <ResumeApplicationModal />
        </FloatingTree>
    );
});

export default FloatingElements;
