/* eslint-disable i18next/no-literal-string */
import {
    Wrapper,
    FriendsWrapper,
    Friend,
    Text,
    Buttons,
    FriendCount,
    CopyButtton,
    GrowButton,
    ArrowAnimation,
    Copied,
} from './styles';

import friendImage1 from '../../images/friend1.png';
import friendImage2 from '../../images/friend2.png';
import friendImage3 from '../../images/friend3.png';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

export default function Friends() {
    const [copied, setCopied] = useState(false);

    const shareLink = 'https://universe.tari.com';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Wrapper>
            <FriendsWrapper>
                <Friend $image={friendImage1} alt="" />
                <Friend $image={friendImage2} alt="" />
                <Friend $image={friendImage3} alt="" />
                <FriendCount>+14</FriendCount>
            </FriendsWrapper>

            <Text>Reduce your timer by inviting friends</Text>

            <Buttons>
                <CopyButtton onClick={handleCopy}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="0.75" y="3.75" width="9" height="9" stroke="currentColor" />
                        <rect x="0.75" y="3.75" width="9" height="9" stroke="currentColor" />
                        <path d="M3.75 3.75V0.75H12.75V9.75H10.25" stroke="currentColor" />
                    </svg>
                    <AnimatePresence>
                        {copied && (
                            <Copied
                                initial={{ opacity: 0, y: 10, x: '-50%' }}
                                animate={{ opacity: 1, y: 0, x: '-50%' }}
                                exit={{ opacity: 0, x: '-50%' }}
                            >
                                Link copied!
                            </Copied>
                        )}
                    </AnimatePresence>
                </CopyButtton>
                <GrowButton>grow your crew</GrowButton>
            </Buttons>

            <ArrowAnimation />
        </Wrapper>
    );
}
