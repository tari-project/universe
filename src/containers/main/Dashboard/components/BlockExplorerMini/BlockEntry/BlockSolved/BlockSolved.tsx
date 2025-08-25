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
import { BlockBubbleData } from '@app/types/mining/blocks.ts';
import { formatBlockNumber, formatReward } from '../../utils/formatting';
import { useTranslation } from 'react-i18next';

export default function BlockSolved({ id, minersSolved, reward, timeAgo, blocks }: BlockBubbleData) {
    const { t } = useTranslation(['mining-view', 'sidebar']);
    const [isHovering, setIsHovering] = useState(false);
    const title = minersSolved > 100 ? `${minersSolved} ${t('bubbles.miners')}` : t('bubbles.pool');
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
                            {`${t('sidebar:block')}: #`}
                            <strong>{formatBlockNumber(id)}</strong>
                        </BlockTitle>
                        <MinersSolved>
                            <PeopleIcon />
                            {title}
                            {` ${t('bubbles.solved')}`}
                        </MinersSolved>

                        <MetaData>
                            <RewardPill $isHovering={isHovering}>
                                <span>{formatReward(reward || 0)} XTM</span>
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
                                    {` ${t('bubbles.ago')}`}
                                </TimeAgo>
                            )}
                        </MetaData>
                    </ContentWrapper>
                </Inside>
            </BoxWrapper>
        </Wrapper>
    );
}
