import { BlockData } from '../../useBlocks';
import BlockTimer from './BlockTimer/BlockTimer';

import { Inside, Wrapper, BoxWrapper, ContentWrapper, Title, VideoWrapper } from './styles';
import BlockVideo from './BlockVideo/BlockVideo';
import { useState, useEffect } from 'react';
import { MetaData, RewardPill, TimeAgo } from '../BlockSolved/styles';
import { AnimatePresence } from 'motion/react';

interface Props extends BlockData {
    isSolved?: boolean;
}

export default function BlockSolving({ id, minersSolved, timeAgo, reward }: Props) {
    const [isSolved, setIsSolved] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsSolved((prevState) => !prevState);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

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
                                    <strong>#{id}</strong>
                                    {` block is being solved`}
                                </Title>
                                <BlockTimer time={`00:00`} />
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
                                        {minersSolved}
                                        {` miners`}
                                    </strong>
                                    {` got rewarded `}
                                </Title>
                                <MetaData>
                                    <RewardPill>
                                        <span>
                                            {reward}
                                            {` XTM`}
                                        </span>
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
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
