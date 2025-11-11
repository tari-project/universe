import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroupTitle, SettingsGroupWrapper } from '../../../components/SettingsGroup.styles.ts';
import { setMoneroAddress, useConfigWalletStore } from '@app/store';
import AddressEditor from '../components/AddressEditor';

const moneroAddressRegex = /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/;
const validationRules = {
    pattern: {
        value: moneroAddressRegex,
        message: 'Invalid Monero address format',
    },
};

const MoneroAddressMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const moneroAddress = useConfigWalletStore((s) => s.monero_address);
    const handleMoneroAddressChange = useCallback(async (moneroAddress: string) => {
        await setMoneroAddress(moneroAddress);
    }, []);

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('monero-address.title')}</Typography>
            </SettingsGroupTitle>

            <AddressEditor
                initialAddress={moneroAddress || ''}
                onApply={handleMoneroAddressChange}
                rules={validationRules}
            />
        </SettingsGroupWrapper>
    );
};

export default MoneroAddressMarkup;
