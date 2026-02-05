/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
vi.hoisted(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        enumerable: true,
        value: vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});
// Now import the store after the mock is set up
import { useUIStore } from './useUIStore';
import { AdminShow } from '@app/store/types/ui.ts';

describe('useUIStore', () => {
    beforeEach(() => {
        useUIStore.setState({
            isWebglNotSupported: false,
            theme: 'light',
            preferredTheme: 'light',
            sidebarOpen: false,
            currentSidebar: 'mining',
            dialogToShow: undefined,
            showExperimental: false,
            showExternalDependenciesDialog: false,
            connectionStatus: 'connected',
            isReconnecting: false,
            showSplashscreen: true,
            hideWalletBalance: false,
            showResumeAppModal: false,
            shouldShowExchangeSpecificModal: false,
            towerSidebarOffset: 0,
            towerInitalized: false,
            showTapplet: false,
            isShuttingDown: false,
            seedlessUI: false,
            setMiningModeAsSchedulerEventMode: false,
            showShutdownSelectionModal: false,
            showFeedbackExitSurveyModal: false,
            showBatteryAlert: false,
            latestVersion: undefined,
            adminShow: undefined,
        });
    });

    describe('initial state', () => {
        it('has isWebglNotSupported as false', () => {
            expect(useUIStore.getState().isWebglNotSupported).toBe(false);
        });

        it('has sidebarOpen as false', () => {
            expect(useUIStore.getState().sidebarOpen).toBe(false);
        });

        it('has currentSidebar as mining', () => {
            expect(useUIStore.getState().currentSidebar).toBe('mining');
        });

        it('has showExperimental as false', () => {
            expect(useUIStore.getState().showExperimental).toBe(false);
        });

        it('has showExternalDependenciesDialog as false', () => {
            expect(useUIStore.getState().showExternalDependenciesDialog).toBe(false);
        });

        it('has connectionStatus as connected', () => {
            expect(useUIStore.getState().connectionStatus).toBe('connected');
        });

        it('has isReconnecting as false', () => {
            expect(useUIStore.getState().isReconnecting).toBe(false);
        });

        it('has showSplashscreen as true', () => {
            expect(useUIStore.getState().showSplashscreen).toBe(true);
        });

        it('has hideWalletBalance as false', () => {
            expect(useUIStore.getState().hideWalletBalance).toBe(false);
        });

        it('has showResumeAppModal as false', () => {
            expect(useUIStore.getState().showResumeAppModal).toBe(false);
        });

        it('has shouldShowExchangeSpecificModal as false', () => {
            expect(useUIStore.getState().shouldShowExchangeSpecificModal).toBe(false);
        });

        it('has towerInitalized as false', () => {
            expect(useUIStore.getState().towerInitalized).toBe(false);
        });

        it('has showTapplet as false', () => {
            expect(useUIStore.getState().showTapplet).toBe(false);
        });

        it('has isShuttingDown as false', () => {
            expect(useUIStore.getState().isShuttingDown).toBe(false);
        });

        it('has seedlessUI as false', () => {
            expect(useUIStore.getState().seedlessUI).toBe(false);
        });

        it('has setMiningModeAsSchedulerEventMode as false', () => {
            expect(useUIStore.getState().setMiningModeAsSchedulerEventMode).toBe(false);
        });

        it('has showShutdownSelectionModal as false', () => {
            expect(useUIStore.getState().showShutdownSelectionModal).toBe(false);
        });

        it('has showFeedbackExitSurveyModal as false', () => {
            expect(useUIStore.getState().showFeedbackExitSurveyModal).toBe(false);
        });

        it('has showBatteryAlert as false', () => {
            expect(useUIStore.getState().showBatteryAlert).toBe(false);
        });
    });

    describe('theme state', () => {
        it('can set theme to dark', () => {
            useUIStore.setState({ theme: 'dark' });
            expect(useUIStore.getState().theme).toBe('dark');
        });

        it('can set theme to light', () => {
            useUIStore.setState({ theme: 'light' });
            expect(useUIStore.getState().theme).toBe('light');
        });

        it('can set preferredTheme', () => {
            useUIStore.setState({ preferredTheme: 'dark' });
            expect(useUIStore.getState().preferredTheme).toBe('dark');
        });
    });

    describe('sidebar state', () => {
        it('can open sidebar', () => {
            useUIStore.setState({ sidebarOpen: true });
            expect(useUIStore.getState().sidebarOpen).toBe(true);
        });

        it('can close sidebar', () => {
            useUIStore.setState({ sidebarOpen: true });
            useUIStore.setState({ sidebarOpen: false });
            expect(useUIStore.getState().sidebarOpen).toBe(false);
        });

        it('can set current sidebar to wallet', () => {
            useUIStore.setState({ currentSidebar: 'wallet' });
            expect(useUIStore.getState().currentSidebar).toBe('wallet');
        });

        it('can set current sidebar to mining', () => {
            useUIStore.setState({ currentSidebar: 'mining' });
            expect(useUIStore.getState().currentSidebar).toBe('mining');
        });
    });

    describe('dialog state', () => {
        it('can set dialogToShow', () => {
            useUIStore.setState({ dialogToShow: 'restart' });
            expect(useUIStore.getState().dialogToShow).toBe('restart');
        });

        it('can clear dialogToShow', () => {
            useUIStore.setState({ dialogToShow: 'restart' });
            useUIStore.setState({ dialogToShow: undefined });
            expect(useUIStore.getState().dialogToShow).toBeUndefined();
        });
    });

    describe('connection state', () => {
        it('can set connection status to disconnected', () => {
            useUIStore.setState({ connectionStatus: 'disconnected' });
            expect(useUIStore.getState().connectionStatus).toBe('disconnected');
        });

        it('can set connection status to disconnected-severe', () => {
            useUIStore.setState({ connectionStatus: 'disconnected-severe' });
            expect(useUIStore.getState().connectionStatus).toBe('disconnected-severe');
        });

        it('can set reconnecting to true', () => {
            useUIStore.setState({ isReconnecting: true });
            expect(useUIStore.getState().isReconnecting).toBe(true);
        });
    });

    describe('splashscreen state', () => {
        it('can hide splashscreen', () => {
            useUIStore.setState({ showSplashscreen: false });
            expect(useUIStore.getState().showSplashscreen).toBe(false);
        });
    });

    describe('wallet balance visibility', () => {
        it('can toggle wallet balance visibility', () => {
            expect(useUIStore.getState().hideWalletBalance).toBe(false);
            useUIStore.setState({ hideWalletBalance: true });
            expect(useUIStore.getState().hideWalletBalance).toBe(true);
            useUIStore.setState({ hideWalletBalance: false });
            expect(useUIStore.getState().hideWalletBalance).toBe(false);
        });
    });

    describe('tower state', () => {
        it('can set towerInitalized', () => {
            useUIStore.setState({ towerInitalized: true });
            expect(useUIStore.getState().towerInitalized).toBe(true);
        });

        it('can set towerSidebarOffset', () => {
            useUIStore.setState({ towerSidebarOffset: 100 });
            expect(useUIStore.getState().towerSidebarOffset).toBe(100);
        });
    });

    describe('tapplet state', () => {
        it('can show tapplet', () => {
            useUIStore.setState({ showTapplet: true });
            expect(useUIStore.getState().showTapplet).toBe(true);
        });

        it('can hide tapplet', () => {
            useUIStore.setState({ showTapplet: true });
            useUIStore.setState({ showTapplet: false });
            expect(useUIStore.getState().showTapplet).toBe(false);
        });
    });

    describe('shutdown state', () => {
        it('can set isShuttingDown', () => {
            useUIStore.setState({ isShuttingDown: true });
            expect(useUIStore.getState().isShuttingDown).toBe(true);
        });

        it('can show shutdown selection modal', () => {
            useUIStore.setState({ showShutdownSelectionModal: true });
            expect(useUIStore.getState().showShutdownSelectionModal).toBe(true);
        });
    });

    describe('feedback state', () => {
        it('can show feedback exit survey modal', () => {
            useUIStore.setState({ showFeedbackExitSurveyModal: true });
            expect(useUIStore.getState().showFeedbackExitSurveyModal).toBe(true);
        });
    });

    describe('battery alert state', () => {
        it('can show battery alert', () => {
            useUIStore.setState({ showBatteryAlert: true });
            expect(useUIStore.getState().showBatteryAlert).toBe(true);
        });

        it('can hide battery alert', () => {
            useUIStore.setState({ showBatteryAlert: true });
            useUIStore.setState({ showBatteryAlert: false });
            expect(useUIStore.getState().showBatteryAlert).toBe(false);
        });
    });

    describe('experimental settings', () => {
        it('can enable experimental settings', () => {
            useUIStore.setState({ showExperimental: true });
            expect(useUIStore.getState().showExperimental).toBe(true);
        });
    });

    describe('external dependencies dialog', () => {
        it('can show external dependencies dialog', () => {
            useUIStore.setState({ showExternalDependenciesDialog: true });
            expect(useUIStore.getState().showExternalDependenciesDialog).toBe(true);
        });
    });

    describe('resume app modal', () => {
        it('can show resume app modal', () => {
            useUIStore.setState({ showResumeAppModal: true });
            expect(useUIStore.getState().showResumeAppModal).toBe(true);
        });
    });

    describe('exchange specific modal', () => {
        it('can show exchange specific modal', () => {
            useUIStore.setState({ shouldShowExchangeSpecificModal: true });
            expect(useUIStore.getState().shouldShowExchangeSpecificModal).toBe(true);
        });
    });

    describe('seedless UI', () => {
        it('can enable seedless UI', () => {
            useUIStore.setState({ seedlessUI: true });
            expect(useUIStore.getState().seedlessUI).toBe(true);
        });
    });

    describe('mining mode scheduler', () => {
        it('can set mining mode as scheduler event mode', () => {
            useUIStore.setState({ setMiningModeAsSchedulerEventMode: true });
            expect(useUIStore.getState().setMiningModeAsSchedulerEventMode).toBe(true);
        });
    });

    describe('webgl support', () => {
        it('can set webgl not supported', () => {
            useUIStore.setState({ isWebglNotSupported: true });
            expect(useUIStore.getState().isWebglNotSupported).toBe(true);
        });
    });

    describe('version state', () => {
        it('can set latest version', () => {
            useUIStore.setState({ latestVersion: '1.2.3' });
            expect(useUIStore.getState().latestVersion).toBe('1.2.3');
        });
    });

    describe('admin state', () => {
        it('can set admin show', () => {
            useUIStore.setState({ adminShow: 'shutdown' as AdminShow });
            expect(useUIStore.getState().adminShow).toBe('shutdown');
        });
    });

    describe('complex state updates', () => {
        it('preserves unrelated state when updating specific fields', () => {
            useUIStore.setState({
                theme: 'dark',
                sidebarOpen: true,
            });

            useUIStore.setState({ sidebarOpen: false });

            expect(useUIStore.getState().theme).toBe('dark');
            expect(useUIStore.getState().sidebarOpen).toBe(false);
        });

        it('can update multiple fields atomically', () => {
            useUIStore.setState({
                theme: 'dark',
                sidebarOpen: true,
                connectionStatus: 'connected',
                showSplashscreen: false,
            });

            const state = useUIStore.getState();
            expect(state.theme).toBe('dark');
            expect(state.sidebarOpen).toBe(true);
            expect(state.connectionStatus).toBe('connected');
            expect(state.showSplashscreen).toBe(false);
        });
    });
});
