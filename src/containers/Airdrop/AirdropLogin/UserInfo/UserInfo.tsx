import {
    Wrapper,
    StatsPill,
    StatsNumber,
    StatsIcon,
    Divider,
    StatsGroup,
    NotificationsButton,
    Dot,
    Menu,
    MenuItem,
    StyledAvatar,
    MenuWrapper,
} from './styles';

import gemImage from './images/gems.png';
import shellImage from './images/shells.png';
import hammerImage from './images/hammers.png';
import { FaBell } from 'react-icons/fa6';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

export default function UserInfo() {
    const { logout, userDetails } = useAirdropStore();

    const [open, setOpen] = useState(false);

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetId = (event.target as any)?.id;
            if (targetId === 'avatar-button' || !open) return;
            handleClose();
        },
        [open]
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    if (!userDetails || !userDetails?.user) return null;

    const profileimageurl = userDetails?.user?.profileimageurl;
    const gems = userDetails?.user?.rank?.gems;
    const shells = userDetails?.user?.rank?.shells;
    const hammers = userDetails?.user?.rank?.hammers;

    const handleClose = () => setOpen(false);
    const handleOpen = () => setOpen(true);

    const handleLogout = () => {
        logout();
    };

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
                <StyledAvatar id="avatar-button" onClick={handleOpen} src={profileimageurl} alt="User Avatar" />

                <AnimatePresence>
                    {open && (
                        <Menu animate={{ opacity: 1 }} exit={{ opacity: 0 }} id="menu-button" onClick={handleClose}>
                            <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
                        </Menu>
                    )}
                </AnimatePresence>
            </MenuWrapper>
        </Wrapper>
    );
}
