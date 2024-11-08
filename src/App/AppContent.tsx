import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppContentWrapper } from './App.styles';

export default function AppContent({ children }: { children: ReactNode }) {
    return (
        <AppContentWrapper>
            <AnimatePresence mode="wait">{children}</AnimatePresence>
        </AppContentWrapper>
    );
}
