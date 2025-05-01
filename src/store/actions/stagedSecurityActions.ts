import { useStagedSecurityStore } from '../useStagedSecurityStore';

export const handleShowStagedSecurityModal = () => {
    useStagedSecurityStore.getState().setShowModal(true);
};
