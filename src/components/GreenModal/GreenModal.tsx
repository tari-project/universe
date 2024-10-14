import { BoxWrapper, CloseButton, Cover, Wrapper } from './styles';

import CloseIcon from './icons/CloseIcon';

interface Props {
    onClose: () => void;
    children: React.ReactNode;
}

export default function GreenModal({ children, onClose }: Props) {
    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CloseButton onClick={onClose}>
                    <CloseIcon />
                </CloseButton>

                {children}
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
