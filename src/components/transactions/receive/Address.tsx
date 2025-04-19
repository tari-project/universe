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
    Tooltip,
    TooltipText,
    TooltipTitle,
} from '../../wallet/Address.style.ts';

import YatHand from '/assets/img/yat_hand.png';

import { truncateMiddle } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import emojiRegex from 'emoji-regex';
import { AnimatePresence } from 'motion/react';

interface Props {
    useEmoji: boolean;
    setUseEmoji: (c: boolean) => void;
}

export function Address({ useEmoji, setUseEmoji }: Props) {
    const { t } = useTranslation('wallet');
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const emojiAddress = useWalletStore((state) => state.tari_address_emoji);
    const displayAddress = truncateMiddle(walletAddress, 6);

    const regexExp = emojiRegex();
    const matches = emojiAddress.match(regexExp);
    const first4 = matches?.slice(0, 4)?.join('');
    const last4 = matches?.slice(matches?.length - 4, matches?.length)?.join('');

    function toggleEmoji() {
        setUseEmoji(!useEmoji);
    }

    const emojiMarkup = (
        <EmojiAddressWrapper title={emojiAddress}>
            <Typography variant="p">
                {first4}
                <span>{`...`}</span>
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

    const textOptionMarkup = <TextOption>{`Tx`}</TextOption>;
    const emojiOptionMarkup = (
        <ImgOption>
            <img src={YatHand} alt="" />
        </ImgOption>
    );

    return (
        <AddressContainer>
            <Label>{t('receive.label-address')}</Label>
            <ContentWrapper>
                <AddressWrapper>{addressMarkup}</AddressWrapper>
                <ToggleWrapper>
                    <ToggleSwitch
                        checked={useEmoji}
                        onChange={toggleEmoji}
                        customDecorators={{ first: textOptionMarkup, second: emojiOptionMarkup }}
                    />
                </ToggleWrapper>
            </ContentWrapper>

            <AnimatePresence>
                {useEmoji && (
                    <Tooltip
                        initial={{ opacity: 0, x: '10px', y: '-50%' }}
                        animate={{ opacity: 1, x: 0, y: '-50%' }}
                        exit={{ opacity: 0, x: '10px', y: '-50%' }}
                    >
                        <TooltipTitle>{t('receive.tooltip-emoji-id-title')}</TooltipTitle>
                        <TooltipText>
                            <p>{t('receive.tooltip-emoji-id-text')}</p>
                            <p>{t('receive.tooltip-emoji-id-text2')}</p>
                        </TooltipText>
                    </Tooltip>
                )}
            </AnimatePresence>
        </AddressContainer>
    );
}
