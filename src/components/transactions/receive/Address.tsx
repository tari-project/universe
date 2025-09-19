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
    TooltipWrapper,
} from './Address.style.ts';

import YatHand from '/assets/img/yat_hand.png';

import { truncateMiddle } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import emojiRegex from 'emoji-regex';
import { AnimatePresence } from 'motion/react';
import {
    autoUpdate,
    FloatingNode,
    FloatingPortal,
    offset,
    useFloating,
    useFloatingNodeId,
    useFloatingParentNodeId,
    useInteractions,
    useRole,
} from '@floating-ui/react';

interface Props {
    useEmoji: boolean;
    setUseEmoji: (c: boolean) => void;
}

export function Address({ useEmoji, setUseEmoji }: Props) {
    const { t } = useTranslation('wallet');
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const emojiAddress = useWalletStore((state) => state.tari_address_emoji);
    const displayAddress = truncateMiddle(walletAddress, 6);
    const parentId = useFloatingParentNodeId();
    const nodeId = useFloatingNodeId(parentId || undefined);
    const regexExp = emojiRegex();
    const matches = emojiAddress.match(regexExp);
    const first4 = matches?.slice(0, 4)?.join('');
    const last4 = matches?.slice(matches?.length - 4, matches?.length)?.join('');

    function toggleEmoji() {
        setUseEmoji(!useEmoji);
    }

    const { refs, context, floatingStyles } = useFloating({
        nodeId,
        open: useEmoji,
        onOpenChange: setUseEmoji,
        middleware: [offset({ mainAxis: 35 })],
        placement: 'left',
        whileElementsMounted: autoUpdate,
    });
    const emojiMarkup = (
        <EmojiAddressWrapper title={emojiAddress}>
            <Typography variant="p">
                {first4}
                <span>{`...`}</span>
                {last4}
            </Typography>
        </EmojiAddressWrapper>
    );

    const textOptionMarkup = <TextOption>{`Tx`}</TextOption>;
    const emojiOptionMarkup = (
        <ImgOption>
            <img src={YatHand} alt="Yat Hand emoji img" />
        </ImgOption>
    );

    const role = useRole(context, { role: 'tooltip' });
    const { getFloatingProps } = useInteractions([role]);
    return (
        <FloatingNode id={nodeId}>
            <AddressContainer>
                <Label>{t('receive.label-address')}</Label>
                <ContentWrapper ref={refs.setReference}>
                    <AddressWrapper>{useEmoji ? emojiMarkup : displayAddress}</AddressWrapper>
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
                        <FloatingPortal>
                            <TooltipWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                                <Tooltip
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                >
                                    <TooltipTitle>{t('receive.tooltip-emoji-id-title')}</TooltipTitle>
                                    <TooltipText>
                                        <p>{t('receive.tooltip-emoji-id-text')}</p>
                                        <p>{t('receive.tooltip-emoji-id-text2')}</p>
                                    </TooltipText>
                                </Tooltip>
                            </TooltipWrapper>
                        </FloatingPortal>
                    )}
                </AnimatePresence>
            </AddressContainer>
        </FloatingNode>
    );
}
