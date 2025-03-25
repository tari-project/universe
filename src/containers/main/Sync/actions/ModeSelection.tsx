import { SyncActionCard } from '@app/containers/main/Sync/components/SyncActionCard.tsx';
import ModeSelect from '@app/containers/navigation/components/Miner/components/ModeSelect.tsx';

export default function ModeSelection() {
    return (
        <SyncActionCard
            action={<ModeSelect />}
            title={'Customize Mode'}
            subtitle={'Did you know you can customize how hard you want your machine to mine?'}
        />
    );
}
