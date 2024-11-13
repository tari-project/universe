import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppContentWrapper } from './App.styles';

export default function AppContent({ children }: { children: ReactNode }) {
    return (
        <AppContentWrapper key="app-content-wrapper">
            <AnimatePresence>{children && children}</AnimatePresence>
        </AppContentWrapper>
    );
}
