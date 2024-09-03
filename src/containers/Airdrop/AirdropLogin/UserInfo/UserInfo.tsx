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
} from './styles';

import { Menu, MenuItem, Grow } from '@mui/material';

import gemImage from './images/gems.png';
import shellImage from './images/shells.png';
import hammerImage from './images/hammers.png';
import { FaBell } from 'react-icons/fa6';
import { useState } from 'react';
import { useAirdropStore } from '@app/store/useAirdropStore';
import { useTranslation } from 'react-i18next';

export default function UserInfo() {
    const { logout, userDetails } = useAirdropStore();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    if (!userDetails || !userDetails?.user) return null;

    const profileimageurl = userDetails?.user?.profileimageurl;
    const gems = userDetails?.user?.rank.gems;
    const shells = userDetails?.user?.rank.shells;
    const hammers = userDetails?.user?.rank.hammers;

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        setAnchorEl(null);
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

            <StyledAvatar
                src={profileimageurl}
                onClick={handleClick}
                alt="User Avatar"
                sx={{ width: 36, height: 36 }}
            />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                TransitionComponent={Grow}
                keepMounted
                sx={{ width: 180 }}
            >
                <MenuItem onClick={handleLogout} sx={{ width: 180 }}>
                    {t('logout')}
                </MenuItem>
            </Menu>
        </Wrapper>
    );
}
