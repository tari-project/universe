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
import avatarImage from './images/avatar.png';
import { FaBell } from 'react-icons/fa6';
import { useState } from 'react';

export default function UserInfo() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        setAnchorEl(null);
        console.log('Log out');
    };

    const showNotificationButton = false;

    return (
        <Wrapper>
            <StatsGroup>
                <StatsPill>
                    <StatsNumber>350</StatsNumber>
                    <StatsIcon src={gemImage} alt="Gems" className="StatsIcon-gems" />
                </StatsPill>
                <StatsPill>
                    <StatsNumber>28</StatsNumber>
                    <StatsIcon src={shellImage} alt="Shells" className="StatsIcon-shells" />
                </StatsPill>
                <StatsPill>
                    <StatsNumber>2</StatsNumber>
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

            <StyledAvatar src={avatarImage} onClick={handleClick} alt="User Avatar" sx={{ width: 36, height: 36 }} />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                TransitionComponent={Grow}
                keepMounted
                sx={{ width: 180 }}
            >
                <MenuItem onClick={handleLogout} sx={{ width: 180 }}>
                    Logout
                </MenuItem>
            </Menu>
        </Wrapper>
    );
}
