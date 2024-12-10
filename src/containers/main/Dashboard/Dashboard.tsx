import { useNotifcations } from '@app/hooks/useNotifications';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useEffect } from 'react';

export default function Dashboard() {
    const { testNotification } = useNotifcations();

    useEffect(() => {
        testNotification();
    }, [testNotification]);

    return (
        <DashboardContentContainer layout>
            <MiningView />
        </DashboardContentContainer>
    );
}
