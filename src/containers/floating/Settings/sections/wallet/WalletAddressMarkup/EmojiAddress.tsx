import * as m from 'motion/react-m';
import emojiRegex from 'emoji-regex';
import { styled } from 'styled-components';
import { useState } from 'react';
import { BsArrowsCollapseVertical, BsArrowsExpandVertical } from 'react-icons/bs';

import { useWalletStore } from '@app/store';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CopyToClipboard } from '@app/containers/floating/Settings/sections/wallet/WalletAddressMarkup/WalletAddressMarkup.tsx';
import { CTASArea, InputArea, WalletSettingsGrid } from '@app/containers/floating/Settings/sections/wallet/styles.ts';

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

export default function EmojiAddress() {
    const walletAddressEmoji = useWalletStore((state) => state.tari_address_emoji);
    const [isCondensed, setIsCondensed] = useState(true);

    return (
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
    );
}
