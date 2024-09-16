import {
    Wrapper,
    StatsPill,
    StatsNumber,
    StatsIcon,
    Divider,
    StatsGroup,
    NotificationsButton,
    Dot,
    StyledAvatar,
    Menu,
    MenuItem,
    MenuWrapper,
} from './styles';

import gemImage from './images/gems.png';
import shellImage from './images/shells.png';
import hammerImage from './images/hammers.png';
import { FaBell } from 'react-icons/fa6';
import { useCallback, useEffect, useState } from 'react';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { appConfig } from '@app/config';

export default function UserInfo() {
    const { logout, userDetails, airdropTokens, userPoints } = useAirdropStore();
    const [open, setOpen] = useState(false);

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const profileimageurl = userDetails?.user?.profileimageurl;
    const gems = userPoints?.gems || userDetails?.user?.rank?.gems;
    const shells = userPoints?.shells || userDetails?.user?.rank?.shells;
    const hammers = userPoints?.hammers || userDetails?.user?.rank?.hammers;

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleLogout = () => {
        logout();
    };

    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (open && (event.target as any)?.id !== 'avatar-wrapper') {
                handleClose();
            }
        },
        [open]
    );

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [handleClickOutside]);

    if (!appConfig.displayAirdropWipUI) return null;
    if (!airdropTokens?.token) return null;

    const showNotificationButton = false;

    return (
        <Wrapper>
            <StatsGroup>
                <StatsPill>
                    <StatsNumber>{gems}</StatsNumber>
                    <StatsIcon src={gemImage} alt="Gems" className="StatsIcon-gems" />
                </StatsPill>
                <StatsPill>
                    <StatsNumber>{shells}</StatsNumber>
                    <StatsIcon src={shellImage} alt="Shells" className="StatsIcon-shells" />
                </StatsPill>
                <StatsPill>
                    <StatsNumber>{hammers}</StatsNumber>
                    <StatsIcon src={hammerImage} alt="Hammers" className="StatsIcon-hammers" />
                </StatsPill>
            </StatsGroup>

            <Divider />

            {showNotificationButton && (
                <NotificationsButton>
                    <FaBell className="NotificationsButtonIcon" />
                    <Dot $color="green" />
                </NotificationsButton>
            )}

            <MenuWrapper>
                <StyledAvatar id="avatar-wrapper" $img={profileimageurl} onClick={handleClick} />
                <AnimatePresence>
                    {open && (
                        <Menu>
                            <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
                        </Menu>
                    )}
                </AnimatePresence>
            </MenuWrapper>
        </Wrapper>
    );
}
