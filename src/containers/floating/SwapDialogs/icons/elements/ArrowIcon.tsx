export const ArrowIcon = ({
    width = '100%',
    onClick,
    style,
}: {
    width: string | number;
    onClick?: () => void;
    style?: React.CSSProperties;
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            viewBox="0 0 13 13"
            fill="none"
            onClick={onClick}
            style={{ display: 'block', margin: 'auto', ...style }}
        >
            <path
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.698"
                d="M1.405 6.925 6.5 12.02l5.095-5.095M6.5 11.312V.98"
            />
        </svg>
    );
};
