import { Address } from '@app/components/wallet/Address.tsx';
import { Wrapper } from './receive.styles';
import { AddressQRCode } from '@app/components/wallet/AddressQRCode.tsx';
import { HeaderLabel, TabHeader } from '../components/Tabs/tab.styles';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useTranslation } from 'react-i18next';

interface Props {
    section: string;
    setSection: (section: string) => void;
}

export function Receive({ setSection }: Props) {
    const { t } = useTranslation('wallet');

    return (
        <>
            <TabHeader $bordered>
                <HeaderLabel>{`${t('tabs.receive')}  ${t('tari')}`}</HeaderLabel>
                <Button size="xs" variant="outlined" onClick={() => setSection('history')}>
                    {t('common:back')}
                </Button>
            </TabHeader>
            <Wrapper>
                <Address />
                <AddressQRCode />
            </Wrapper>
        </>
    );
}
