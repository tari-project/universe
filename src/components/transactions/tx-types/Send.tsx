import { Typography } from '@app/components/elements/Typography.tsx';
import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

export function Send() {
    return (
        <TabContentWrapper>
            <Typography>{`send content!`}</Typography>
            <TxInput placeholder={'Enter wallet address'} />
            <TxInput placeholder={'Amount'} icon={<TariOutlineSVG />} type="number" />

            <Stack alignItems="flex-end" justifyContent="flex-end" flexDirection="row" style={{ width: `100%` }}>
                <Button size="xs" variant="outlined">{`Max`}</Button>
            </Stack>
        </TabContentWrapper>
    );
}
