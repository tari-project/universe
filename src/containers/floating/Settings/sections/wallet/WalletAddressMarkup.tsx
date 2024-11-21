import {
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useCallback, useState } from 'react';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';
import emojiRegex from 'emoji-regex';
import { styled } from 'styled-components';
import { BsArrowsExpandVertical, BsArrowsCollapseVertical } from 'react-icons/bs';
import { useWalletStore } from '@app/store/useWalletStore';

import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { useTranslation } from 'react-i18next';

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

const AddressContainer = styled.div`
    overflow-x: auto;
    font-size: 14px;
    letter-spacing: 1px;
    font-weight: 500;
    line-height: 1.3;
    width: 100%;
    height: 40px;
    align-items: center;
    display: flex;
    padding: 10px;
    background-color: ${({ theme }) => theme.palette.background.default};
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    border-radius: 10px;
`;

const AddressInner = styled.div`
    width: max-content;
    display: flex;
`;

const CopyToClipboard = ({ text }: { text: string | undefined }) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const handleCopy = useCallback(
        (text?: string) => {
            if (!text) return;
            copyToClipboard(text + '');
        },
        [copyToClipboard]
    );

    return (
        <IconButton onClick={() => handleCopy(text)}>
            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
        </IconButton>
    );
};

const WalletAddressMarkup = () => {
    const [isCondensed, setIsCondensed] = useState(true);
    const { t } = useTranslation('settings', { useSuspense: false });
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const walletAddressEmoji = useWalletStore((state) => state.tari_address_emoji);

    if (!walletAddress) return null;

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

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('tari-wallet-address')}</Typography>
            </SettingsGroupTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <AddressContainer>
                    <Typography>{walletAddress}</Typography>
                </AddressContainer>
                <CopyToClipboard text={walletAddress} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems={isCondensed ? 'center' : 'flex-start'}>
                <AddressContainer style={{ height: isCondensed ? '40px' : 'auto' }}>
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
                <Stack direction="row" gap={4}>
                    <IconButton
                        onClick={() => setIsCondensed(!isCondensed)}
                        style={{
                            minWidth: 34,
                        }}
                    >
                        {isCondensed ? <BsArrowsExpandVertical size={16} /> : <BsArrowsCollapseVertical size={16} />}
                    </IconButton>
                    <CopyToClipboard text={walletAddressEmoji} />
                </Stack>
            </Stack>
        </SettingsGroupWrapper>
    );
};

export default WalletAddressMarkup;
