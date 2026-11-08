import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { setL2Open, setShowTapplet } from '@app/store/actions/uiStoreActions';
import { deactivateTapplet } from '@app/store/useTappletsStore.ts';
import { cancelOpenL2Wait, openL2 } from '@app/store/actions/l2OpenActions.ts';
import { SpinnerIcon } from '@app/components/elements/loaders/SpinnerIcon.tsx';

export default function L2Button() {
    const { t } = useTranslation('wallet');
    const l2Open = useUIStore((s) => s.l2Open);
    const showTapplet = useUIStore((s) => s.showTapplet);
    // The PIN state is unknown until the backend emits it during wallet setup.
    // A click in this state is not dropped: openL2 waits for the real state and
    // the button spins until it arrives, instead of guessing "no PIN" (#3518).
    // An open panel can still be closed in this state.
    const pinStateKnown = useWalletStore((s) => s.is_pin_locked !== undefined);
    const [waitingForPin, setWaitingForPin] = useState(false);
    const isWaiting = waitingForPin && !pinStateKnown && !l2Open;

    return (
        <Button
            $isActive={l2Open}
            $isToggle={true}
            type="button"
            disabled={isWaiting}
            aria-busy={isWaiting}
            onClick={() => {
                if (showTapplet) {
                    // Leave the bridge the way the Mine button does, then open the L2 card.
                    setShowTapplet(false);
                    deactivateTapplet();
                } else if (l2Open) {
                    cancelOpenL2Wait();
                    setL2Open(false);
                    return;
                }
                if (!pinStateKnown) {
                    setWaitingForPin(true);
                }
                void openL2().finally(() => {
                    setWaitingForPin(false);
                });
            }}
            aria-label={t('l2.title')}
            title={isWaiting ? t('l2.loading') : pinStateKnown ? t('l2.title') : t('l2.waiting-for-wallet')}
            data-testid="sidebar-l2-button"
            data-active={l2Open}
            data-pin-state-known={pinStateKnown}
        >
            {isWaiting ? (
                <SpinnerIcon />
            ) : (
                /* Two linked rings: the L1 and L2 chains woven together. */
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                        d="M11.10 20.91 A7 7 0 1 1 16.12 17.39"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M16.90 7.09 A7 7 0 1 1 11.88 10.61"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                    />
                </svg>
            )}
        </Button>
    );
}
