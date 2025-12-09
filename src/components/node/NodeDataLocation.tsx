import { Typography } from '../elements/Typography.tsx';
import { BodyCopy, CTAWrapper, SelectionCTA, Wrapper } from './styles.ts';

export function NodeDataLocation() {
    return (
        <Wrapper>
            <Typography variant="h3">{`Node Data Location`}</Typography>
            <BodyCopy>{`Where would you like to store the blockchain data? This can be changed later from settings.`}</BodyCopy>

            <CTAWrapper>
                <SelectionCTA size="small">
                    <Typography variant="h6">{`Select custom location`}</Typography>
                </SelectionCTA>
                <SelectionCTA size="small" $default>
                    <Typography variant="h6">{`Continue with default`}</Typography>
                </SelectionCTA>
            </CTAWrapper>
        </Wrapper>
    );
}
