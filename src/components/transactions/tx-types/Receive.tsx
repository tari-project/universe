import { Typography } from '@app/components/elements/Typography.tsx';
import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';

export function Receive() {
    return (
        <TabContentWrapper>
            <Typography>{`Receive content!`}</Typography>
        </TabContentWrapper>
    );
}
