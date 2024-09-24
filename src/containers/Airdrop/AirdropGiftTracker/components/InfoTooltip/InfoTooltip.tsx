import { Wrapper } from './styles';

interface Props {
    children: React.ReactNode;
}

export default function InfoTooltip({ children }: Props) {
    return <Wrapper>{children}</Wrapper>;
}
