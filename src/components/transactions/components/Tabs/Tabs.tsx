import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type TabsProps } from './types';
import { TabContent } from './TabContent.tsx';
import { TabsWrapper, Wrapper, NavButton, BottomNavWrapper, TabNavigation, NavLabel } from './tab.styles';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export function Tabs({ tabItems }: TabsProps) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const showMainWalletNav = currentIndex !== 0;

    const mainWalletNav = showMainWalletNav ? (
        <TabNavigation>
            <NavLabel variant="p">{`${t(tabItems[currentIndex].titleTransaltionKey)}  Tari`}</NavLabel>
            <Button size="xs" variant="outlined" onClick={() => setCurrentIndex(0)}>
                {`Back`}
            </Button>
        </TabNavigation>
    ) : null;

    const bottomNavMarkup = !showMainWalletNav
        ? tabItems.map(({ id, titleTransaltionKey }, i) => {
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
                      {t(titleTransaltionKey)}
                  </NavButton>
              );
          })
        : null;

    return (
        <Wrapper>
            {mainWalletNav}
            <TabsWrapper>
                <TabContent items={tabItems} currentIndex={currentIndex} />
            </TabsWrapper>
            <BottomNavWrapper>{bottomNavMarkup}</BottomNavWrapper>
        </Wrapper>
    );
}
