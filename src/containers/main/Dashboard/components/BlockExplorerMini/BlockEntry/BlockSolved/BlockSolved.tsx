import { useState } from 'react';
import BlockProgress from './BlockProgress/BlockProgress';
import PeopleIcon from './PeopleIcon';
import {
    Divider,
    ContentWrapper,
    BlockTitle,
    MinersSolved,
    MetaData,
    RewardPill,
    TimeAgo,
    Inside,
    Wrapper,
    BoxWrapper,
    RewardPillHoverBg,
} from './styles';
import { AnimatePresence } from 'motion/react';
import { BlockData } from '../../useBlocks';

export default function BlockSolved({ id, minersSolved, reward, timeAgo, blocks }: BlockData) {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <Wrapper
            layout="position"
            layoutId={id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: [0.15, 0, 0, 0.97] }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <BoxWrapper>
                <Inside>
                    <BlockProgress blocks={blocks || 0} maxBlocks={1000} isHovering={isHovering} />
                    <Divider />
                    <ContentWrapper>
                        <BlockTitle>
                            {`Block: #`}
                            <strong>{id}</strong>
                        </BlockTitle>
                        <MinersSolved>
                            <PeopleIcon />
                            {minersSolved}
                            {` miners solved`}
                        </MinersSolved>

                        <MetaData>
                            <RewardPill $isHovering={isHovering}>
                                <span>
                                    {reward}
                                    {` XTM`}
                                </span>
                                <AnimatePresence>
                                    {isHovering && (
                                        <RewardPillHoverBg
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        />
                                    )}
                                </AnimatePresence>
                            </RewardPill>
                            {timeAgo && (
                                <TimeAgo>
                                    {timeAgo}
                                    {` ago`}
                                </TimeAgo>
                            )}
                        </MetaData>
                    </ContentWrapper>
                </Inside>
            </BoxWrapper>
        </Wrapper>
    );
}
