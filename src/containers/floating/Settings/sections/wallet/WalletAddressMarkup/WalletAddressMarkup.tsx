import {
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useCallback, useState } from 'react';
import * as m from 'motion/react-m';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import emojiRegex from 'emoji-regex';
import { styled } from 'styled-components';
import { BsArrowsCollapseVertical, BsArrowsExpandVertical } from 'react-icons/bs';
import { useWalletStore } from '@app/store/useWalletStore';

import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { useTranslation } from 'react-i18next';
import { setExternalTariAddress } from '@app/store/actions/walletStoreActions';
import AddressEditor from '../components/AddressEditor';
import {
    CTASArea,
    InputArea,
    SecondaryAddressesWrapper,
    WalletSettingsGrid,
} from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { useValidateTariAddress } from '@app/hooks/wallet/useValidate.ts';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { Input } from '@app/components/elements/inputs/Input.tsx';
import { truncateMiddle } from '@app/utils';

const Dot = styled.div`
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #b6b7c3;
`;

const DotContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
    margin: 0 4px;
`;

const AddressContainer = styled(m.div)`
    overflow-x: auto;
    font-size: 12px;
    letter-spacing: 1px;
    line-height: 1.3;
    width: 100%;
    min-height: 40px;
    align-items: center;
    display: flex;
    padding: 8px;
    background-color: ${({ theme }) => theme.palette.background.default};
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    border-radius: 10px;
`;

const AddressInner = styled.div`
    display: flex;
    height: 100%;
`;

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
    const { data } = useFetchExchangeBranding();
    const walletType = useWalletStore((state) => state.tari_address_type);
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const walletAddressEmoji = useWalletStore((state) => state.tari_address_emoji);
    const isWXTM = data?.wxtm_mode && walletType.toString() === 'External'; //TariAddressType.External;
    // should only exist in case mining to exchange with wxtm_mode enabled
    const ethAddress = useWalletStore((state) => state.getETHAddressOfCurrentExchange());

    const { validateAddress } = useValidateTariAddress();
    const [isCondensed, setIsCondensed] = useState(true);

    function condenseEmojiAddress(emojiAddress: string | undefined) {
        const regex = emojiRegex();
        if (!emojiAddress) {
            return '';
        }

        const matches = emojiAddress.match(regex);
        if (matches) {
            return (
                <>
                    {matches[0]}
                    {matches[1]} | {matches[2]}
                    {matches[3]}
                    {matches[4]}
                    <DotContainer>
                        <Dot />
                        <Dot />
                        <Dot />
                    </DotContainer>
                    {matches[matches.length - 3]}
                    {matches[matches.length - 2]}
                    {matches[matches.length - 1]}
                </>
            );
        } else {
            return '';
        }
    }

    const validationRules = {
        validate: async (value) => {
            const isValid = await validateAddress(value);
            return isValid || 'Invalid address format';
        },
    };

    const ethMarkup = !!ethAddress?.length && (
        <>
            <SettingsGroupTitle style={{ marginBottom: 10 }}>
                <Typography variant="h6">{`Exchange ETH Address`}</Typography>
            </SettingsGroupTitle>
            <WalletSettingsGrid>
                <InputArea>
                    <Input disabled value={truncateMiddle(ethAddress, 8)} style={{ fontSize: '12px' }} />
                </InputArea>
                <CTASArea>
                    <CopyToClipboard text={ethAddress} />
                </CTASArea>
            </WalletSettingsGrid>
        </>
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tari-wallet-address')}</Typography>
            </SettingsGroupTitle>
            <WalletSettingsGrid>
                <InputArea>
                    <AddressContainer
                        animate={{ height: isCondensed ? '40px' : 'auto' }}
                        transition={{ duration: 0.1, ease: 'linear' }}
                    >
                        <AddressInner>
                            <Typography
                                style={{
                                    color: '#b6b7c3',
                                    display: 'flex',
                                    lineHeight: '1.6',
                                }}
                            >
                                {isCondensed ? condenseEmojiAddress(walletAddressEmoji) : walletAddressEmoji}
                            </Typography>
                        </AddressInner>
                    </AddressContainer>
                </InputArea>
                <CTASArea>
                    <IconButton size="small" onClick={() => setIsCondensed(!isCondensed)}>
                        {isCondensed ? <BsArrowsExpandVertical /> : <BsArrowsCollapseVertical />}
                    </IconButton>
                    <CopyToClipboard text={walletAddressEmoji} />
                </CTASArea>
            </WalletSettingsGrid>
            <SecondaryAddressesWrapper>
                <AddressEditor
                    initialAddress={walletAddress}
                    onApply={setExternalTariAddress}
                    rules={validationRules}
                    isWXTM={!!isWXTM}
                />

                {ethMarkup}
            </SecondaryAddressesWrapper>
        </SettingsGroupWrapper>
    );
};

export default WalletAddressMarkup;
