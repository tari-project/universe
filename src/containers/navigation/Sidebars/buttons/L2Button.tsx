import { useTranslation } from 'react-i18next';
import { Button } from './styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setL2Open } from '@app/store/actions/uiStoreActions';

export default function L2Button() {
    const { t } = useTranslation('wallet');
    const l2Open = useUIStore((s) => s.l2Open);
    const showTapplet = useUIStore((s) => s.showTapplet);

    return (
        <Button
            $isActive={l2Open}
            $isToggle={true}
            type="button"
            onClick={() => setL2Open(!l2Open)}
            disabled={showTapplet}
            aria-label={t('l2.title')}
            title={t('l2.title')}
            data-testid="sidebar-l2-button"
            data-active={l2Open}
        >
            <span style={{ fontSize: 18, fontWeight: 700 }}>{`L2`}</span>
        </Button>
    );
}
