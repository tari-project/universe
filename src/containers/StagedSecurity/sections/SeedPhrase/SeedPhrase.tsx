import { StagedSecuritySectionType } from '../../StagedSecurityModal';
import { Wrapper } from './styles';

interface Props {
    setSection: (section: StagedSecuritySectionType) => void;
}

export default function SeedPhrase({ setSection }: Props) {
    return <Wrapper>SeedPhrase</Wrapper>;
}
