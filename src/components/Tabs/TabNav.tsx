import styled from 'styled-components';
import { TabItem } from './Tabs.tsx';

const Wrapper = styled.div`
    display: grid;
    padding: min(calc(1rem + 2vmin), 30px);
    justify-content: stretch;
    place-items: center;
    grid-auto-flow: column;
    width: 100%;
`;

const NavButton = styled.button<{ $isActive?: boolean }>`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.7)};

    &:hover {
        opacity: 0.85;
    }
`;
interface TabNavProps {
    items: TabItem[];
    currentIndex: number;
    onClick: (index: number) => void;
}
function TabNav({ items, currentIndex, onClick }: TabNavProps) {
    return (
        <Wrapper>
            {items.map(({ id, title }, i) => (
                <NavButton $isActive={currentIndex === i} key={`item:${i}-${id}`} onClick={() => onClick(i)}>
                    {title}
                </NavButton>
            ))}
        </Wrapper>
    );
}

export { TabNav };
