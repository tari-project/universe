import BlockSolved from './BlockSolved/BlockSolved';
import BlockSolving from './BlockSolving/BlockSolving';
import { BlockData } from '../useBlocks';

interface Props extends BlockData {
    isFirstEntry?: boolean;
}

export default function BlockEntry({ id, minersSolved, reward, timeAgo, blocks, isFirstEntry, isSolved }: Props) {
    return (
        <>
            {isFirstEntry ? (
                <BlockSolving
                    id={id}
                    minersSolved={minersSolved}
                    reward={reward}
                    timeAgo={timeAgo}
                    blocks={blocks}
                    isSolved={isSolved}
                />
            ) : (
                <BlockSolved id={id} minersSolved={minersSolved} reward={reward} timeAgo={timeAgo} blocks={blocks} />
            )}
        </>
    );
}
