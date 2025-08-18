import useBlockTime from '@app/hooks/mining/useBlockTime.ts';
import { Wrapper } from './styles';

export default function BlockTimer() {
    const { currentTimeShort } = useBlockTime();
    return (
        <Wrapper>
            <span>{currentTimeShort}</span>
        </Wrapper>
    );
}
