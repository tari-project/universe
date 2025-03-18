import { ReactNode } from 'react';

export interface TabItem {
    id: string;
    titleTransaltionKey: string;
    content: ReactNode;
}

export interface TabsProps {
    tabItems: TabItem[];
}
