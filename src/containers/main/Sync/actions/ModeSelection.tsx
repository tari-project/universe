import { SyncActionCard } from '../components/SyncActionCard.tsx';
import ModeSelect from '@app/containers/navigation/components/Miner/components/ModeSelect.tsx';
import { SelectWrapper } from '@app/containers/main/Sync/actions/actions.style.ts';

export default function ModeSelection() {
    const action = (
        <SelectWrapper>
            <ModeSelect variant="minimal" />
        </SelectWrapper>
    );
    return (
        <SyncActionCard
            action={action}
            title={'Customize Mode'}
            subtitle={'Did you know you can customize how hard you want your machine to mine?'}
        />
    );
}
