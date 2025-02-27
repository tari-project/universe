import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';

export default function Dashboard() {
    const view = useUIStore((s) => s.view);
    return (
        <DashboardContentContainer>
            {view === 'mining' ? (
                <MiningView />
            ) : (
                <div>
                    <h1>{`hello i am a wallet view`}</h1>
                </div>
            )}
        </DashboardContentContainer>
    );
}
