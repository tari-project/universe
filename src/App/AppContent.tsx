import { ReactNode } from 'react';

import { AppContentWrapper } from './App.styles';

export default function AppContent({ children }: { children: ReactNode }) {
    return <AppContentWrapper key="app-content-wrapper">{children}</AppContentWrapper>;
}
