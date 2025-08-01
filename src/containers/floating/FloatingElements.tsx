import { FloatingTree } from '@floating-ui/react';

import SettingsModal from './Settings/SettingsModal.tsx';
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

import XSpaceEventBanner from './XSpaceBanner/XSpaceBanner.tsx';
import { CustomPowerLevelsDialogContainer } from '@app/containers/navigation/components/Miner/components/CustomPowerLevels/CustomPowerLevelsDialogContainer.tsx';
import EXModal from '@app/containers/floating/EXModal/EXModal.tsx';
import UniversalEXSelectorModal from '@app/containers/floating/UniversalEXSelectorModal/UniversalEXSelectorModal.tsx';
import XCLinkModal from '@app/components/exchanges/LinkModal/LinkModal.tsx';
import KeychainDialog from './Keychain/KeychainDialog.tsx';
import ForgotPinDialog from './security/pin/ForgotPinDialog.tsx';
import SecurityPromptDialog from '@app/containers/floating/security/prompt/SecurityPromptDialog.tsx';
import SeedPhrase from '@app/containers/floating/security/seedphrase/SeedPhrase.tsx';
import SecurityReminder from '@app/components/security/reminder/SecurityReminder.tsx';
import CreatePinDialog from '@app/containers/floating/security/pin/CreatePinDialog.tsx';
import EnterPinDialog from '@app/containers/floating/security/pin/EnterPinDialog.tsx';
import CrewRewards from '../main/CrewRewards/CrewRewards.tsx';

const environment = import.meta.env.MODE;

const FloatingElements = () => {
    return (
        <FloatingTree>
            {environment === 'development' && <AdminUI />}
            <SettingsModal />
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
            <EXModal />
            <UniversalEXSelectorModal />
            <XCLinkModal />
            <KeychainDialog />
            <ForgotPinDialog />
            <SecurityPromptDialog />
            <SeedPhrase />
            <SecurityReminder />
            <CreatePinDialog />
            <EnterPinDialog />
            <CrewRewards />
        </FloatingTree>
    );
};

export default FloatingElements;
