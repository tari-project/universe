import { ActionWrapper, Card, CardActionWrapper, CardSubtitle, CardTitle } from './syncAction.style.ts';
import { ReactNode } from 'react';

interface SyncActionCardProps {
    title: string;
    action?: ReactNode;
    subtitle?: string;
}
export function SyncActionCard({ title, action, subtitle }: SyncActionCardProps) {
    return (
        <Card>
            <CardTitle>{title}</CardTitle>
            <CardSubtitle>{subtitle}</CardSubtitle>
            <CardActionWrapper>
                <ActionWrapper>{action}</ActionWrapper>
            </CardActionWrapper>
        </Card>
    );
}
