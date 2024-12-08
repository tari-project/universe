import { BoxContent, BoxWrapper, CloseButton, ContentLayer, Cover, Wrapper } from './styles';

import CloseIcon from './icons/CloseIcon';
import { useShellOfSecretsStore } from '../../../../store/useShellOfSecretsStore';
//import Scanlines from '../components/Scanlines/Scanlines';
import SoSMainSidebar from './sections/SoSMainSidebar/SoSMainSidebar';
import SoSMainContent from './sections/SoSMainContent/SoSMainContent';

export default function SoSMainModal() {
    const { setShowMainModal } = useShellOfSecretsStore();

    const handleClose = () => {
        setShowMainModal(false);
    };

    return (
        <Wrapper>
            <BoxWrapper initial={{ opacity: 0, y: '100px' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CloseButton onClick={handleClose}>
                    <CloseIcon />
                </CloseButton>

                <BoxContent>
                    <ContentLayer>
                        <SoSMainSidebar />
                        <SoSMainContent />
                    </ContentLayer>
                    {/*}<Scanlines />{*/}
                </BoxContent>
            </BoxWrapper>

            <Cover onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        </Wrapper>
    );
}
