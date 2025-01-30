import { BoxWrapper, CloseButton, Cover, Wrapper } from './styles';

import CloseIcon from './icons/CloseIcon';

interface Props {
    onClose: () => void;
    children: React.ReactNode;
    boxWidth?: number;
    padding?: number;
}

export default function GreenModal({ children, boxWidth, padding, onClose }: Props) {
    return (
        <Wrapper>
            <BoxWrapper
                $boxWidth={boxWidth}
                $padding={padding}
                initial={{ opacity: 0, y: '100px' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
            >
                <CloseButton onClick={onClose}>
                    <CloseIcon />
                </CloseButton>

                {children}
            </BoxWrapper>

            <Cover onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
