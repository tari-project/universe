import { FloatingTree } from '@floating-ui/react';

import AdminUI from '../../components/AdminUI/AdminUI.tsx';
import ToastStack from '../../components/ToastStack/ToastStack.tsx';
import XCLinkModal from '../../components/exchanges/LinkModal/LinkModal.tsx';
import { CustomPowerLevelsDialogContainer } from '../navigation/components/Miner/components/CustomPowerLevels/CustomPowerLevelsDialogContainer.tsx';
import ShellOfSecrets from '../main/ShellOfSecrets/ShellOfSecrets.tsx';
import CrewRewards from '../main/CrewRewards/CrewRewards.tsx';

import AutoUpdateDialog from './AutoUpdateDialog/AutoUpdateDialog.tsx';
import ShutdownSelectionDialog from './ShutdownSelectionDialog/index.ts';
import CreatePinDialog from './security/pin/CreatePinDialog.tsx';
import CriticalErrorDialog from './CriticalErrorDialog/CriticalErrorDialog.tsx';
import CriticalProblemDialog from './CriticalProblemDialog/CriticalProblemDialog.tsx';
import ExitFeedbackSurveyDialog from './user/surveys/ExitFeedbackSurveyDialog.tsx';
import LongTimeUserFeedbackDialog from './user/surveys/LongTimeUserFeedbackDialog.tsx';

import EXModal from './EXModal/EXModal.tsx';
import EnterPinDialog from './security/pin/EnterPinDialog.tsx';
import ExternalDependenciesDialog from './ExternalDependenciesDialog/ExternalDependenciesDialog.tsx';
import FailedModuleInitializationDialog from './FailedModuleInitializationDialog/FailedModuleInitializationDialog.tsx';
import ForgotPinDialog from './security/pin/ForgotPinDialog.tsx';
import KeychainDialog from './Keychain/KeychainDialog.tsx';
import LudicrousCofirmationDialog from './LudicrousCofirmationDialog/LudicrousCofirmationDialog.tsx';
import PaperWalletModal from './PaperWalletModal/PaperWalletModal.tsx';
import ReleaseNotesDialog from './ReleaseNotesDialog/ReleaseNotesDialog.tsx';
import SecurityPromptDialog from './security/prompt/SecurityPromptDialog.tsx';
import SeedPhrase from './security/seedphrase/SeedPhrase.tsx';
import SettingsModal from './Settings/SettingsModal.tsx';
import ShareRewardModal from './ShareRewardModal/ShareRewardModal';
import UniversalEXSelectorModal from './UniversalEXSelectorModal/UniversalEXSelectorModal.tsx';
import XSpaceEventBanner from './XSpaceBanner/XSpaceBanner.tsx';
import SchedulerModal from './scheduler/SchedulerModal.tsx';

const environment = import.meta.env.MODE;

const FloatingElements = () => {
    return (
        <FloatingTree>
            {environment === 'development' && <AdminUI />}

            <AutoUpdateDialog />
            <ShutdownSelectionDialog />
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
            <EXModal />
            <UniversalEXSelectorModal />
            <XCLinkModal />
            <KeychainDialog />
            <ForgotPinDialog />
            <SecurityPromptDialog />
            <SeedPhrase />
            <CreatePinDialog />
            <EnterPinDialog />
            <CrewRewards />
            <SettingsModal />
            <FailedModuleInitializationDialog />
            <ExitFeedbackSurveyDialog />
            <LongTimeUserFeedbackDialog />
            <SchedulerModal />
        </FloatingTree>
    );
};

export default FloatingElements;
