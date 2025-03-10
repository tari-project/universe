import { ReactNode } from 'react';

export interface TabItem {
    id: string;
    title: string;
    content: ReactNode;
}

export interface TabsProps {
    tabItems: TabItem[];
}
export interface TabNavProps {
    items: TabItem[];
    currentIndex: number;
    onClick: (index: number) => void;
}
