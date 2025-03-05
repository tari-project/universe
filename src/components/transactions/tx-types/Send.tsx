import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function Send() {
    const [amount, setAmount] = useState('');
    const [destination, setDestination] = useState('');

    const handleSend = useCallback(async () => {
        await invoke('send_one_sided_to_stealth_address', {
            amount,
            destination,
        });
    }, [amount, destination]);

    return (
        <TabContentWrapper>
            <TxInput placeholder={'Enter wallet address'} onChange={(e) => setDestination(e.target.value)} />
            <TxInput placeholder={'Amount'} icon={<TariOutlineSVG />} onChange={(e) => setAmount(e.target.value)} />
            <Button onClick={handleSend}>{'Send'}</Button>

            <Stack alignItems="flex-end" justifyContent="flex-end" direction="row" style={{ width: `100%` }}>
                <Button size="xs" variant="outlined">{`Max`}</Button>
            </Stack>
        </TabContentWrapper>
    );
}
