export default function AppFallback() {
    const style = {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#212121',
    };
    return (
        <div style={style}>
            <img src="public/tari_logo_light.png" alt="App fallback" style={{ width: '80px', height: '80px' }} />
        </div>
    );
}
