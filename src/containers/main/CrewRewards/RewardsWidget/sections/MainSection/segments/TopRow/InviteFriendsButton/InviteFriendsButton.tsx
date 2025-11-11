import LinkIcon from './LinkIcon';
import { Copied, IconWrapper, Wrapper } from './styles';
import { useAirdropStore } from '@app/store';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function InviteFriendsButton({ largeButton = false }: { largeButton?: boolean }) {
    const { t } = useTranslation();
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdrop_url || '');
    const referralCode = useAirdropStore((state) => state.userDetails?.user?.referral_code || '');

    const handleClick = () => {
        if (referralCode && airdropUrl && !isCopied) {
            copyToClipboard(`${airdropUrl}/download/${referralCode}`);
        }
    };

    return (
        <Wrapper type="button" onClick={handleClick} $largeButton={largeButton}>
            <AnimatePresence>
                {isCopied && (
                    <Copied
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {t('airdrop:crewRewards.copied')}
                    </Copied>
                )}
            </AnimatePresence>
            {largeButton ? 'Invite More Friends' : t('airdrop:crewRewards.inviteFriends')}
            <IconWrapper>
                <LinkIcon />
            </IconWrapper>
        </Wrapper>
    );
}
