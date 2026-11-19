import { useTranslation } from 'react-i18next';
import { Button } from './styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setMiningPageOpen, setShowTapplet } from '@app/store/actions/uiStoreActions';
import { deactivateTapplet } from '@app/store/useTappletsStore.ts';

export default function MiningPageButton() {
    const { t } = useTranslation('sidebar');
    const miningPageOpen = useUIStore((s) => s.miningPageOpen);
    const showTapplet = useUIStore((s) => s.showTapplet);

    const handleClick = () => {
        if (showTapplet) {
            setShowTapplet(false);
            deactivateTapplet();
        }
        setMiningPageOpen(!miningPageOpen);
    };

    return (
        <Button
            $isActive={miningPageOpen}
            $isToggle={true}
            type="button"
            onClick={handleClick}
            aria-label={t('mining-page.title')}
            title={t('mining-page.title')}
            data-testid="sidebar-mining-page-button"
            data-active={miningPageOpen}
        >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                    d="M14 2.5L24.5 8.75V19.25L14 25.5L3.5 19.25V8.75L14 2.5Z"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                />
                <path
                    d="M9.5 14.5L12.75 17.75L18.5 11.5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Button>
    );
}
