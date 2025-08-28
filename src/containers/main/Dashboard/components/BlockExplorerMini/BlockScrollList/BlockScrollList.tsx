import { BlockBubbleData } from '@app/types/mining/blocks.ts';
import { DragContainer, ScrollMask } from './styles';
import { Suspense } from 'react';
import BlockEntry from '../BlockEntry/BlockEntry';

interface Props {
    data?: BlockBubbleData[];
}

export default function BlockScrollList({ data }: Props) {
    return (
        <ScrollMask>
            <DragContainer>
                <Suspense fallback={<div></div>}>
                    {data &&
                        data.map(({ id, minersSolved, reward, timeAgo, blocks }) => (
                            <BlockEntry
                                key={id}
                                id={id}
                                minersSolved={minersSolved}
                                reward={reward}
                                timeAgo={timeAgo}
                                blocks={blocks}
                            />
                        ))}
                </Suspense>
            </DragContainer>
        </ScrollMask>
    );
}
