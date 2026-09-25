import { useTranslation } from 'react-i18next';
import { Button } from './styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setL2Open, setShowTapplet } from '@app/store/actions/uiStoreActions';
import { deactivateTapplet } from '@app/store/useTappletsStore.ts';

export default function L2Button() {
    const { t } = useTranslation('wallet');
    const l2Open = useUIStore((s) => s.l2Open);
    const showTapplet = useUIStore((s) => s.showTapplet);

    return (
        <Button
            $isActive={l2Open}
            $isToggle={true}
            type="button"
            onClick={() => {
                if (showTapplet) {
                    // Leave the bridge the way the Mine button does, then open the L2 card.
                    setShowTapplet(false);
                    deactivateTapplet();
                    setL2Open(true);
                    return;
                }
                setL2Open(!l2Open);
            }}
            aria-label={t('l2.title')}
            title={t('l2.title')}
            data-testid="sidebar-l2-button"
            data-active={l2Open}
        >
            {/* Two linked rings: the L1 and L2 chains woven together. */}
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
        </Button>
    );
}
