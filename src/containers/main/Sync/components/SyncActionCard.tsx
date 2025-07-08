import { ActionWrapper, Card, CardSubtitle, CardTitle, CartTextGroup } from './syncAction.style.ts';
import { ReactNode } from 'react';

interface SyncActionCardProps {
    title: string;
    action?: ReactNode;
    subtitle?: string;
}
export function SyncActionCard({ title, action, subtitle }: SyncActionCardProps) {
    return (
        <Card>
            <CartTextGroup>
                <CardTitle>{title}</CardTitle>
                <CardSubtitle>{subtitle}</CardSubtitle>
            </CartTextGroup>

            <ActionWrapper>{action}</ActionWrapper>
        </Card>
    );
}
