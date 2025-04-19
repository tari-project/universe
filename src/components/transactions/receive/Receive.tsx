import { Wrapper } from './receive.styles';
import { AddressQRCode } from './AddressQRCode';
import { CopyAddress } from './CopyAddress';
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
