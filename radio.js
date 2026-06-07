// radio.js - Lógica para el diseño skeuomórfico

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audioElement');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusText = document.getElementById('statusText');
    const volumeSlider = document.getElementById('volumeSlider');
    const knob = document.getElementById('knob');
    const volValueText = document.getElementById('volValue');
    const clockElement = document.getElementById('clock');

    // --- LEER PARÁMETROS DE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const streamFromParam = urlParams.get('stream');
    const logoFromParam = urlParams.get('logo');
    const fbFromParam = urlParams.get('fb');
    const twFromParam = urlParams.get('tw');
    const mailFromParam = urlParams.get('mail');

    if (streamFromParam) {
        audio.querySelector('source').src = streamFromParam;
        audio.load();
    }

    const logoImg = document.querySelector('.aac-player__logo');
    if (logoFromParam && logoImg) {
        logoImg.src = logoFromParam;
        logoImg.style.display = 'block';
    }

    const fbBtn = document.querySelector('.aac-player__social-btn--fb');
    const twBtn = document.querySelector('.aac-player__social-btn--tw');
    const mailBtn = document.querySelector('.aac-player__social-btn--em');

    if (fbFromParam && fbBtn) fbBtn.href = fbFromParam;
    if (twFromParam && twBtn) twBtn.href = twFromParam;
    if (mailFromParam && mailBtn) mailBtn.href = "mailto:" + mailFromParam;
    // --- FIN LECTURA PARÁMETROS ---

    let isPlaying = false;

    // Reloj digital continuo
    setInterval(() => {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hrs}: ${mins}: ${secs}`;
    }, 1000);

    // Lógica Play
    playBtn.addEventListener('click', async () => {
        try {
            statusText.textContent = 'BUFFERING';
            await audio.play();
            statusText.textContent = 'ONLINE';
            isPlaying = true;
        } catch (e) {
            console.error(e);
            statusText.textContent = 'ERROR';
        }
    });

    // Lógica Stop
    stopBtn.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = audio.src; // recargar el stream
        statusText.textContent = 'OFFLINE';
        isPlaying = false;
    });

    // Lógica Volumen y Knob Rotación
    // El slider va de 0 a 1. Lo mapearemos a grados: -135 a +135
    const updateVolume = (val) => {
        audio.volume = val;
        volValueText.textContent = parseFloat(val).toFixed(1);
        
        // Mapear 0 - 1 a grados
        const degrees = (val * 270) - 135;
        knob.style.transform = `rotate(${degrees}deg)`;
    };

    volumeSlider.addEventListener('input', (e) => {
        updateVolume(e.target.value);
    });

    // Inicializar perilla al valor inicial
    updateVolume(volumeSlider.value);

    // Eventos de estado de audio
    audio.addEventListener('playing', () => {
        statusText.textContent = 'ONLINE';
    });

    audio.addEventListener('error', () => {
        statusText.textContent = 'OFFLINE';
    });

    // Animación del vúmetro en el Canvas
    const canvas = document.getElementById('vumeter');
    const ctx = canvas.getContext('2d');
    
    // Ajustar resolución del canvas
    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawVumeter = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        const segments = 40;
        const segmentWidth = canvas.width / segments;

        for (let i = 0; i <= segments; i++) {
            const x = i * segmentWidth;
            let y = canvas.height / 2;
            
            // Si está reproduciendo, generar picos aleatorios (fake vumeter)
            // Se hace fake porque WebAudio API suele dar error de CORS en streams de radio
            if (isPlaying && i > 0 && i < segments) {
                // Hacer que salte basándose en el volumen
                const maxJump = (canvas.height / 2.5) * volumeSlider.value;
                const jump = (Math.random() * maxJump * 2) - maxJump;
                y += jump;
            }
            
            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#b4c219'; // var(--wave-color)
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#b4c219';
        ctx.stroke();

        requestAnimationFrame(drawVumeter);
    };

    drawVumeter();

    // Autoplay según config
    setTimeout(() => {
        statusText.textContent = 'BUFFERING';
        audio.play().then(() => {
            statusText.textContent = 'ONLINE';
            isPlaying = true;
        }).catch(e => {
            statusText.textContent = 'OFFLINE';
        });
    }, 500);
});
