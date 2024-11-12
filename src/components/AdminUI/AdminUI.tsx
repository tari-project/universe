/* eslint-disable i18next/no-literal-string */

import { useAppStateStore } from '@app/store/appStateStore';
import { useUIStore } from '@app/store/useUIStore';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';
import { useStagedSecurityStore } from '@app/store/useStagedSecurityStore';
import { useShareRewardStore } from '@app/store/useShareRewardStore';
import { MenuWrapper, Button, MenuContent, ToggleButton, CategoryLabel, ButtonGroup } from './styles';
import { useFloating, offset, shift, flip, useClick, useInteractions, useDismiss } from '@floating-ui/react';
import { useState } from 'react';

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

    const { setCriticalError, setError, criticalError, error } = useAppStateStore();
    const { setTheme, theme } = useUIStore();
    const { showModal: showPaperWallet, setShowModal: setShowPaperWallet } = usePaperWalletStore();
    const { showModal: showStagedSecurity, setShowModal: setShowStagedSecurity } = useStagedSecurityStore();
    const { showModal: showShareReward, setShowModal: setShowShareReward } = useShareRewardStore();

    const getToggleStyle = (isActive?: boolean) => ({
        background: isActive ? '#666' : '#444',
    });

    return (
        <>
            <ToggleButton ref={refs.setReference} {...getReferenceProps()}>
                Admin Menu
            </ToggleButton>
            {isOpen && (
                <MenuWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                    <MenuContent>
                        <CategoryLabel>UI Theme</CategoryLabel>
                        <ButtonGroup>
                            <Button onClick={() => setTheme('light')} style={getToggleStyle(theme === 'light')}>
                                Light Theme
                            </Button>
                            <Button onClick={() => setTheme('dark')} style={getToggleStyle(theme === 'dark')}>
                                Dark Theme
                            </Button>
                        </ButtonGroup>

                        <CategoryLabel>Error Testing</CategoryLabel>
                        <ButtonGroup>
                            <Button
                                onClick={() => setCriticalError(criticalError ? undefined : 'This is a critical error')}
                                style={getToggleStyle(!!criticalError)}
                            >
                                Critical Error
                            </Button>
                            <Button
                                onClick={() => setError(error ? undefined : 'This is a normal error')}
                                style={getToggleStyle(!!error)}
                            >
                                Normal Error
                            </Button>
                        </ButtonGroup>

                        <CategoryLabel>Modals</CategoryLabel>
                        <ButtonGroup>
                            <Button
                                onClick={() => setShowPaperWallet(!showPaperWallet)}
                                style={getToggleStyle(showPaperWallet)}
                            >
                                Paper Wallet
                            </Button>
                            <Button
                                onClick={() => setShowStagedSecurity(!showStagedSecurity)}
                                style={getToggleStyle(showStagedSecurity)}
                            >
                                Staged Security
                            </Button>
                            <Button
                                onClick={() => setShowShareReward(!showShareReward)}
                                style={getToggleStyle(showShareReward)}
                            >
                                Share Reward
                            </Button>
                        </ButtonGroup>
                    </MenuContent>
                </MenuWrapper>
            )}
        </>
    );
}
