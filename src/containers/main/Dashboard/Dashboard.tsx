import { useNotifcations } from '@app/hooks/useNotifications';
import MiningView from './MiningView/MiningView';
import { DashboardContentContainer } from './styles';
import { useEffect } from 'react';

export default function Dashboard() {
    return (
        <DashboardContentContainer layout>
            <MiningView />
        </DashboardContentContainer>
    );
}
