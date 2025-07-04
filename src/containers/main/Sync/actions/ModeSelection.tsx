import { SyncActionCard } from '../components/SyncActionCard.tsx';
import ModeSelect from '@app/containers/navigation/components/Miner/components/ModeSelect.tsx';
import { SelectWrapper } from '@app/containers/main/Sync/actions/actions.style.ts';
import { useTranslation } from 'react-i18next';

export default function ModeSelection() {
    const { t } = useTranslation('setup-view');
    const action = (
        <SelectWrapper>
            <ModeSelect variant="minimal" isSync />
        </SelectWrapper>
    );
    return <SyncActionCard action={action} title={t('actions.mode')} subtitle={t('actions.mode-copy')} />;
}
