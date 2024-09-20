import React, { useState } from 'react';
import { TabsContainer, TabHeaders, TabHeader, TabContent } from './Tabs.styles';

interface Tab {
    label: string;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
}

const SettingsTabs: React.FC<TabsProps> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <TabsContainer>
            <TabHeaders>
                {tabs.map((tab, index) => (
                    <TabHeader key={`tab-${index}`} $active={activeTab === index} onClick={() => setActiveTab(index)}>
                        {tab.label}
                    </TabHeader>
                ))}
            </TabHeaders>
            <TabContent>{tabs[activeTab].content}</TabContent>
        </TabsContainer>
    );
};

export { SettingsTabs };
