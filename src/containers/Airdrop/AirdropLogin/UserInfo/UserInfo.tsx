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
import { FaBell } from 'react-icons/fa6';
import { useCallback, useEffect, useState } from 'react';
import { GIFT_GEMS, REFERRAL_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import DownloadReferralModal from './DownloadReferralModal/DownloadReferralModal';
import { NumberPill } from '../ConnectButton/styles';
import GemsPill from './GemsPill/GemsPill';

export default function UserInfo() {
    const { logout, userDetails, airdropTokens, userPoints, wipUI, referralCount } = useAirdropStore();
    const [open, setOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState<'claim' | 'invite' | undefined>(undefined);

    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const profileimageurl = userDetails?.user?.profileimageurl;
    const rank = userPoints?.base.rank || userDetails?.user?.rank?.rank;

    const handleClick = () => {
        setOpen(!open);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleLogout = () => {
        logout();
    };

    const handleReferalClose = () => {
        setModalOpen(undefined);
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

    const [gems, setGems] = useState(0);

    useEffect(() => {
        setGems(userPoints?.base.gems || userDetails?.user?.rank?.gems || 0);
    }, [userPoints?.base.gems, userDetails?.user?.rank?.gems]);

    if (!wipUI) return null;
    if (!airdropTokens?.token) return null;

    const showNotificationButton = false;

    return (
        <>
            <Wrapper>
                <StatsGroup>
                    <GemsPill value={gems} />

                    {referralCount?.count ? (
                        <StatsPill>
                            <StatsNumber>{referralCount.count} 🎁</StatsNumber>
                        </StatsPill>
                    ) : null}

                    {rank && (
                        <StatsPill>
                            <StatsNumber>Rank #{parseInt(rank).toLocaleString()}</StatsNumber>
                        </StatsPill>
                    )}
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
                            <Menu initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <MenuItem onClick={() => setModalOpen('invite')}>
                                    {t('referral')}{' '}
                                    <NumberPill>
                                        <StatsIcon src={gemImage} alt="Gems" className="StatsIcon-gems" /> +
                                        {REFERRAL_GEMS}
                                    </NumberPill>
                                </MenuItem>
                                <MenuItem onClick={() => setModalOpen('claim')}>
                                    {t('claimGems')}{' '}
                                    <NumberPill>
                                        <StatsIcon src={gemImage} alt="Gems" className="StatsIcon-gems" /> +{GIFT_GEMS}
                                    </NumberPill>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
                            </Menu>
                        )}
                    </AnimatePresence>
                </MenuWrapper>
            </Wrapper>
            <AnimatePresence>
                {modalOpen && (
                    <DownloadReferralModal
                        referralCode={modalOpen === 'invite' ? userDetails?.user?.referral_code : undefined}
                        onClose={handleReferalClose}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
