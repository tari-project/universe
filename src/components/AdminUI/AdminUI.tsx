/* eslint-disable i18next/no-literal-string */

import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';
import { useStagedSecurityStore } from '@app/store/useStagedSecurityStore';
import { useShareRewardStore } from '@app/store/useShareRewardStore';
import { MenuWrapper, Button, MenuContent, ToggleButton, CategoryLabel, ButtonGroup } from './styles';
import { useFloating, offset, shift, flip, useClick, useInteractions, useDismiss } from '@floating-ui/react';
import { useState } from 'react';
import { addToast } from '@app/components/ToastStack/useToastStore';

export default function AdminUI() {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [offset(10), flip(), shift()],
        placement: 'bottom-end',
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    const { setCriticalError, criticalError, isSettingUp, setIsSettingUp } = useAppStateStore();
    const {
        setTheme,
        theme,
        setDialogToShow,
        dialogToShow,
        showExternalDependenciesDialog,
        setShowExternalDependenciesDialog,
    } = useUIStore();
    const { showModal: showPaperWallet, setShowModal: setShowPaperWallet } = usePaperWalletStore();
    const { showModal: showStagedSecurity, setShowModal: setShowStagedSecurity } = useStagedSecurityStore();
    const { showModal: showShareReward, setShowModal: setShowShareReward } = useShareRewardStore();

    const showBasicToast = () => {
        addToast({
            title: 'Changes saved',
            text: 'All your changes have been saved to the cloud',
        });
    };

    const showErrorToast = () => {
        addToast({
            title: 'Connection failed',
            text: 'Please check your internet connection and try again',
            type: 'error',
        });
    };

    const showWarningToast = () => {
        addToast({
            title: 'Session expiring soon',
            text: 'Your session will expire in 5 minutes. Please save your work.',
            type: 'warning',
        });
    };

    const showSuccessToast = () => {
        addToast({
            title: 'Profile updated',
            text: 'Your changes have been synced across all devices',
            type: 'success',
        });
    };

    return (
        <>
            <ToggleButton ref={refs.setReference} {...getReferenceProps()}>
                UI Debug
            </ToggleButton>
            {isOpen && (
                <MenuWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                    <MenuContent>
                        <CategoryLabel>UI Theme</CategoryLabel>
                        <ButtonGroup>
                            <Button onClick={() => setTheme('light')} $isActive={theme === 'light'}>
                                Light Theme
                            </Button>
                            <Button onClick={() => setTheme('dark')} $isActive={theme === 'dark'}>
                                Dark Theme
                            </Button>
                        </ButtonGroup>

                        <CategoryLabel>Dialogs</CategoryLabel>
                        <ButtonGroup>
                            <Button
                                onClick={() => setCriticalError(criticalError ? undefined : 'This is a critical error')}
                                $isActive={!!criticalError}
                            >
                                Critical Error
                            </Button>
                            <Button
                                onClick={() =>
                                    setDialogToShow(dialogToShow === 'autoUpdate' ? undefined : 'autoUpdate')
                                }
                                $isActive={dialogToShow === 'autoUpdate'}
                            >
                                Auto Update Dialog
                            </Button>
                            <Button
                                onClick={() => setShowExternalDependenciesDialog(!showExternalDependenciesDialog)}
                                $isActive={showExternalDependenciesDialog}
                            >
                                External Dependencies
                            </Button>
                        </ButtonGroup>

                        <CategoryLabel>Green Modals</CategoryLabel>
                        <ButtonGroup>
                            <Button onClick={() => setShowPaperWallet(!showPaperWallet)} $isActive={showPaperWallet}>
                                Paper Wallet
                            </Button>
                            <Button
                                onClick={() => setShowStagedSecurity(!showStagedSecurity)}
                                $isActive={showStagedSecurity}
                            >
                                Staged Security
                            </Button>
                            <Button onClick={() => setShowShareReward(!showShareReward)} $isActive={showShareReward}>
                                Share Reward
                            </Button>
                        </ButtonGroup>

                        <CategoryLabel>Toasts</CategoryLabel>
                        <ButtonGroup>
                            <Button onClick={showBasicToast}>Basic Toast</Button>
                            <Button onClick={showErrorToast}>Error Toast</Button>
                            <Button onClick={showWarningToast}>Warning Toast</Button>
                            <Button onClick={showSuccessToast}>Success Toast</Button>
                        </ButtonGroup>

                        <CategoryLabel>Other UI</CategoryLabel>
                        <ButtonGroup>
                            <Button onClick={() => setIsSettingUp(!isSettingUp)} $isActive={isSettingUp}>
                                Startup Screen
                            </Button>
                        </ButtonGroup>
                    </MenuContent>
                </MenuWrapper>
            )}
        </>
    );
}
