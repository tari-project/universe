/* eslint-disable i18next/no-literal-string */
import { invoke } from '@tauri-apps/api/core';
import { Button, ButtonGroup, CategoryLabel } from '../styles';

export function TransferGroup() {
    const handleClick = () => {
        invoke('send_one_sided_to_stealth_address', {
            amount: '111',
            destination: 'f2FZ9MmtkbcxNwF1Qia1RykS2i3ycaJC5er32xaFi1fpkNKjKvVo6VFPKjoigSME76EmsaDPZLXu2e3ivp5MWSU54ie',
        });
    };

    return (
        <>
            <CategoryLabel>Transfer</CategoryLabel>
            <ButtonGroup>
                <Button onClick={handleClick}>Send tx</Button>
            </ButtonGroup>
        </>
    );
}
