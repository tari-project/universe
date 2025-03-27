import { Address } from '@app/components/wallet/Address.tsx';
import { Wrapper } from './receive.styles';
import { AddressQRCode } from '@app/components/wallet/AddressQRCode.tsx';

export function Receive() {
    return (
        <Wrapper>
            <Address />
            <AddressQRCode />
        </Wrapper>
    );
}
