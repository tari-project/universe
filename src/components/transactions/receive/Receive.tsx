import { Wrapper } from './receive.styles';
import { AddressQRCode } from '@app/components/wallet/AddressQRCode';
import { CopyAddress } from '@app/components/wallet/CopyAddress';
import { useState } from 'react';

export function Receive() {
    const [useEmoji, setUseEmoji] = useState(false);

    return (
        <Wrapper>
            <AddressQRCode useEmoji={useEmoji} setUseEmoji={setUseEmoji} />
            <CopyAddress useEmoji={useEmoji} />
        </Wrapper>
    );
}
