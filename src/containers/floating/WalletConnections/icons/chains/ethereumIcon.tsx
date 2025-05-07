export default function EthereumIcon({ width, fill = 'black' }: { width?: string | number; fill?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            fill="none"
            viewBox="0 0 10 16"
            style={{ maxHeight: '100%' }}
        >
            <path fill={fill} d="M4.998 0 4.89.365v10.58l.11.108 4.996-2.904L4.998 0Z" style={{ opacity: 1 }} />
            <path fill={fill} d="M4.996 0 0 8.15l4.996 2.903V0Z" style={{ opacity: 0.6 }} />
            <path fill={fill} d="m5 11.98-.061.073v3.77l.061.176 5-6.92-5 2.9Z" style={{ opacity: 0.9 }} />
            <path fill={fill} d="M4.996 16v-4.02L0 9.078 4.996 16Z" style={{ opacity: 0.6 }} />
            <path fill={fill} d="M5.001 11.053 9.997 8.15 5.001 5.918v5.135Z" style={{ opacity: 0.75 }} />
            <path fill={fill} d="m0 8.15 4.996 2.903V5.918L0 8.15Z" style={{ opacity: 0.8 }} />
        </svg>
    );
}
