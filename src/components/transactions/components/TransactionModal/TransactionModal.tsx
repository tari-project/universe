import CloseIcon from './icons/CloseIcon';
import { BoxWrapper, CloseButton, Cover, Wrapper } from './styles';

interface Props {
    handleClose: () => void;
    children: React.ReactNode;
}

export default function TransactionModal({ children, handleClose }: Props) {
    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CloseButton onClick={handleClose}>
                    <CloseIcon />
                </CloseButton>

                {children}
            </BoxWrapper>

            <Cover onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
