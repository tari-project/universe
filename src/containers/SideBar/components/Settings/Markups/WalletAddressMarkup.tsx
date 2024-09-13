import { useCallback, useState } from 'react';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';
import emojiRegex from 'emoji-regex';
import { styled } from 'styled-components';
import { BsArrowsExpandVertical, BsArrowsCollapseVertical } from 'react-icons/bs';

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
    width: 100%;
    padding: 10px;
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: 8px;
`;

const AddressInner = styled.div`
    width: max-content;
`;

const WalletAddressMarkup = () => {
    const [isCondensed, setIsCondensed] = useState(true);
    const { walletAddress, walletAddressEmoji } = useAppStatusStore((state) => ({
        walletAddress: state.tari_address_base58,
        walletAddressEmoji: state.tari_address_emoji,
    }));

    if (!walletAddress) return null;

    const CopyToClipboard = ({ text }: { text: string | undefined }) => {
        const [isCopied, setIsCopied] = useState(false);

        const copyToClipboard = useCallback((text: string | undefined) => {
            if (!text) return;
            navigator.clipboard.writeText(text + '').then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000);
            });
        }, []);

        return (
            <IconButton onClick={() => copyToClipboard(text)}>
                {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
            </IconButton>
        );
    };

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
        <Stack>
            <Typography variant="h6">Tari Wallet Address</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <AddressContainer>
                    <Typography variant="p">{walletAddress}</Typography>
                </AddressContainer>
                <CopyToClipboard text={walletAddress} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <AddressContainer>
                    <AddressInner>
                        <Typography
                            variant="p"
                            style={{
                                color: '#b6b7c3',
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
        </Stack>
    );
};

export default WalletAddressMarkup;
