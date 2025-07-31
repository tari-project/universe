import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';

import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton';

import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';

import EmojiAddress from './EmojiAddress.tsx';
import BaseAddress from './BaseAddress.tsx';
import ETHAddress from './ETHAddress.tsx';

import { SettingsGroupTitle, SettingsGroupWrapper } from '../../../components/SettingsGroup.styles';
import { SecondaryAddressesWrapper } from './styles.ts';

export const CopyToClipboard = ({ text }: { text: string | undefined }) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const handleCopy = useCallback(
        (text?: string) => {
            if (!text) return;
            copyToClipboard(text + '');
        },
        [copyToClipboard]
    );

    return (
        <IconButton size="small" onClick={() => handleCopy(text)}>
            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
        </IconButton>
    );
};

const WalletAddressMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tari-wallet-address')}</Typography>
            </SettingsGroupTitle>
            <EmojiAddress />
            <SecondaryAddressesWrapper>
                <BaseAddress />
                <ETHAddress />
            </SecondaryAddressesWrapper>
        </SettingsGroupWrapper>
    );
};

export default WalletAddressMarkup;
