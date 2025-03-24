import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type TabsProps } from './types';
import { TabContent } from './TabContent.tsx';
import {
    TabsWrapper,
    Wrapper,
    NavButton,
    BottomNavWrapper,
    TabHeader,
    HeaderLabel,
    StyledIconButton,
    AddressWrapper,
    NavButtonContent,
} from './tab.styles';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useWalletStore } from '@app/store';
import { truncateMiddle } from '@app/utils';
import { useCopyToClipboard } from '@app/hooks';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { SendSVG } from '@app/assets/icons/send.tsx';
import { ReceiveSVG } from '@app/assets/icons/receive.tsx';

const icons = {
    send: <SendSVG />,
    receive: <ReceiveSVG />,
};
export function Tabs({ tabItems }: TabsProps) {
    const { t } = useTranslation(['wallet', 'common']);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const walletAddress = useWalletStore((state) => state.tari_address_base58);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const displayAddress = truncateMiddle(walletAddress, 4);
    const showTabNav = currentIndex !== 0;

    const tabNav = showTabNav ? (
        <TabHeader $bordered>
            <HeaderLabel>{`${t(tabItems[currentIndex].titleTransaltionKey)}  ${t('tari')}`}</HeaderLabel>
            <Button size="xs" variant="outlined" onClick={() => setCurrentIndex(0)}>
                {t('common:back')}
            </Button>
        </TabHeader>
    ) : (
        <TabHeader>
            <HeaderLabel>{t(tabItems[currentIndex].titleTransaltionKey)}</HeaderLabel>
            <AddressWrapper>
                <HeaderLabel>{displayAddress}</HeaderLabel>
                <StyledIconButton onClick={() => copyToClipboard(walletAddress)}>
                    {!isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />}
                </StyledIconButton>
            </AddressWrapper>
        </TabHeader>
    );

    const bottomNavMarkup = !showTabNav ? (
        <BottomNavWrapper>
            {tabItems.map(({ id, titleTransaltionKey }, i) => {
                if (id === 'history') return null;
                const isActive = currentIndex === i;
                return (
                    <NavButton
                        key={`item:${i}-${id}`}
                        onClick={() => setCurrentIndex(i)}
                        $isActive={isActive}
                        aria-selected={isActive}
                        id={`tab-${id}`}
                    >
                        <NavButtonContent>
                            {icons[id]}
                            {t(titleTransaltionKey)}
                        </NavButtonContent>
                    </NavButton>
                );
            })}
        </BottomNavWrapper>
    ) : null;

    return (
        <Wrapper>
            {tabNav}
            <TabsWrapper>
                <TabContent items={tabItems} currentIndex={currentIndex} />
            </TabsWrapper>
            {bottomNavMarkup}
        </Wrapper>
    );
}
