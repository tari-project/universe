import BlockTimer from './BlockTimer/BlockTimer';

import { Inside, Wrapper, BoxWrapper, ContentWrapper, Title, VideoWrapper } from './styles';
import BlockVideo from './BlockVideo/BlockVideo';
import { MetaData, TimeAgo, BottomWrapper, RewardPillBlack } from '../BlockSolved/styles';
import { AnimatePresence } from 'motion/react';
import { formatReward, formatBlockNumber } from '../../utils/formatting';
import { BlockData } from '../../useBlocks';

export default function BlockSolving({ id, minersSolved, timeAgo, reward, isSolved }: BlockData) {
    return (
        <Wrapper
            layout="position"
            layoutId={id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: [0.15, 0, 0, 0.97] }}
        >
            <AnimatePresence mode="popLayout">
                {!isSolved ? (
                    <BoxWrapper
                        $isSolved={isSolved}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={`solving-${id}`}
                        transition={{ duration: 1.5, ease: [0.15, 0, 0, 0.97] }}
                    >
                        <Inside $isSolved={isSolved}>
                            <VideoWrapper>
                                <BlockVideo isSolved={isSolved} />
                            </VideoWrapper>
                            <ContentWrapper $isSolved={isSolved}>
                                <Title>
                                    <strong>#{formatBlockNumber(id)}</strong>
                                    {` block`}
                                    <br />
                                    {`is being solved`}
                                </Title>
                                <BottomWrapper>
                                    {reward && (
                                        <RewardPillBlack $isSolved={isSolved}>
                                            <span>
                                                {formatReward(reward)}
                                                {` XTM`}
                                            </span>
                                        </RewardPillBlack>
                                    )}
                                    <BlockTimer time={`00:00`} />
                                </BottomWrapper>
                            </ContentWrapper>
                        </Inside>
                    </BoxWrapper>
                ) : (
                    <BoxWrapper
                        $isSolved={isSolved}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={`solved-${id}`}
                        transition={{ duration: 1.5, ease: [0.15, 0, 0, 0.97] }}
                    >
                        <Inside $isSolved={isSolved}>
                            <VideoWrapper>
                                <BlockVideo isSolved={isSolved} />
                            </VideoWrapper>
                            <ContentWrapper $isSolved={isSolved}>
                                <Title>
                                    <strong>
                                        {minersSolved} {minersSolved > 1 ? 'miners' : 'pool'}
                                    </strong>
                                    {` got rewarded`}
                                </Title>
                                <MetaData>
                                    <RewardPillBlack $isSolved={isSolved}>{reward} XTM</RewardPillBlack>
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
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
