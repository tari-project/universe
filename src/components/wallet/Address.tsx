import { useWalletStore } from '@app/store';
import {
    AddressContainer,
    AddressWrapper,
    ContentWrapper,
    EmojiAddressWrapper,
    ImgOption,
    Label,
    TextOption,
    ToggleWrapper,
} from './Address.style.ts';

import YatHand from '/assets/img/yat_hand.png';

import { truncateMiddle } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useCopyToClipboard } from '@app/hooks';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import emojiRegex from 'emoji-regex';

export function Address() {
    const [useEmoji, setUseEmoji] = useState(false);
    const { t } = useTranslation('wallet');
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const emojiAddress = useWalletStore((state) => state.tari_address_emoji);
    const displayAddress = truncateMiddle(walletAddress, 5);

    const regexExp = emojiRegex();
    const matches = emojiAddress.match(regexExp);
    const first4 = matches?.slice(0, 4)?.join('');
    const last4 = matches?.slice(matches?.length - 4, matches?.length)?.join('');

    function handleCopyClick() {
        copyToClipboard(useEmoji ? emojiAddress : walletAddress);
    }
    function toggleEmoji() {
        setUseEmoji((c) => !c);
    }

    const emojiMarkup = (
        <EmojiAddressWrapper title={emojiAddress}>
            <Typography variant="p">
                {first4}
                <span>{`....`}</span>
                {last4}
            </Typography>
        </EmojiAddressWrapper>
    );

    const addressMarkup = useEmoji ? (
        emojiMarkup
    ) : (
        <Typography title={walletAddress} variant="h4">
            {displayAddress}
        </Typography>
    );

    const textOptionMarkup = <TextOption>{`Aa`}</TextOption>;
    const emojiOptionMarkup = (
        <ImgOption>
            <img src={YatHand} alt="" />
        </ImgOption>
    );

    return (
        <AddressContainer>
            <Label>{t('receive.label-address')}</Label>
            <ContentWrapper>
                <AddressWrapper>
                    {addressMarkup}
                    <IconButton size="small" onClick={handleCopyClick} variant="secondary">
                        {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                </AddressWrapper>
                <ToggleWrapper>
                    <ToggleSwitch
                        checked={useEmoji}
                        onChange={toggleEmoji}
                        customDecorators={{ first: textOptionMarkup, second: emojiOptionMarkup }}
                    />
                </ToggleWrapper>
            </ContentWrapper>
        </AddressContainer>
    );
}
