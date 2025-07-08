export default function AppFallback() {
    const style = {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#212121',
    };

    const imgStyle = {
        width: '40px',
        height: '40px',
        '@keyframes show': {
            from: {
                opacity: 0.1,
            },
            to: {
                opacity: 1,
            },
        },
        animation: `show 2s linear`,
    };
    return (
        <div style={style}>
            <img src="public/tari_logo_light.png" alt="App fallback" style={imgStyle} />
        </div>
    );
}
