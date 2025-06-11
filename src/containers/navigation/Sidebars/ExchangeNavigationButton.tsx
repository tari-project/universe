import { ExchangeNavIcon } from '@app/assets/icons/exchange-nav.tsx';
import { useConfigBEInMemoryStore } from '@app/store';
import { setShowUniversalModal } from '@app/store/useExchangeStore';
import { memo } from 'react';
import { NavigationWrapper } from './SidebarMini.styles';
import { NavButton } from './NavigationButton';

export const ExchangeNavigationButton = memo(function NavigationButton() {
    const isUniversalMiner = useConfigBEInMemoryStore((state) => state.isUniversalMiner);
    function handleClick() {
        setShowUniversalModal(true);
    }
    return (
        <>
            {isUniversalMiner && (
                <NavigationWrapper>
                    <NavButton onClick={handleClick} isActive>
                        <ExchangeNavIcon />
                    </NavButton>
                </NavigationWrapper>
            )}
        </>
    );
});
