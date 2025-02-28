import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

export function Send() {
    return (
        <TabContentWrapper>
            <TxInput placeholder={'Enter wallet address'} />
            <TxInput placeholder={'Amount'} type="number" icon={<TariOutlineSVG />} />

            <Stack alignItems="flex-end" justifyContent="flex-end" direction="row" style={{ width: `100%` }}>
                <Button size="xs" variant="outlined">{`Max`}</Button>
            </Stack>
        </TabContentWrapper>
    );
}
