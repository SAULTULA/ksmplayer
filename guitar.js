// guitar.js - Lógica e interacción de los componentes de la guitarra

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audioElement');
    const playSwitch = document.getElementById('playSwitch');
    const statusText = document.getElementById('statusText');
    
    const volKnob = document.getElementById('volKnob');
    const volSlider = document.getElementById('volSlider');
    
    const widthSlider = document.getElementById('widthSlider');
    const spacingLeftSlider = document.getElementById('spacingLeftSlider');
    const spacingRightSlider = document.getElementById('spacingRightSlider');
    const heightSlider = document.getElementById('heightSlider');
    const rotateSlider = document.getElementById('rotateSlider');
    
    const textSizeSlider = document.getElementById('textSizeSlider');
    
    // Configuración de los 3 Vúmetros
    const vumeters = [
        { id: '1', el: document.getElementById('dragVumeter1'), canvas: document.getElementById('vumeter1') },
        { id: '2', el: document.getElementById('dragVumeter2'), canvas: document.getElementById('vumeter2') },
        { id: '3', el: document.getElementById('dragVumeter3'), canvas: document.getElementById('vumeter3') }
    ];
    vumeters.forEach(v => v.ctx = v.canvas.getContext('2d'));
    
    let activeVumeter = vumeters[0]; // Por defecto el 1

    let isPlaying = false;
    let isEditMode = false;
    let isDraggingAction = false;

    // --- Lógica del Switch (Play/Stop) ---
    const toggleAudio = async () => {
        if (isPlaying) {
            audio.pause();
            audio.removeAttribute('src'); // Forma segura de limpiar el buffer en todos los navegadores
            audio.load();
            playSwitch.classList.remove('active');
            statusText.textContent = 'OFFLINE';
            isPlaying = false;
        } else {
            try {
                // Usamos la URL configurada globalmente
                audio.src = currentStreamUrl;
                audio.load();
                playSwitch.classList.add('active');
                await audio.play();
                statusText.textContent = 'ONLINE';
                isPlaying = true;
            } catch (e) {
                console.error("Error al reproducir:", e);
                statusText.textContent = 'ERROR (Clic de nuevo)';
                playSwitch.classList.remove('active');
                isPlaying = false;
            }
        }
    };

    playSwitch.addEventListener('click', (e) => {
        if (isEditMode && isDraggingAction) {
            // Si estábamos arrastrando, ignoramos el clic para no encender/apagar accidentalmente
            return;
        }
        toggleAudio();
    });

    // --- Lógica de Potenciómetros (Giro de las perillas) ---
    const updateKnob = (slider, knobElement) => {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 1;
        const val = parseFloat(slider.value);
        const percent = (val - min) / (max - min);
        // Rotar de -135 grados a 135 grados
        const rotation = -135 + (percent * 270);
        knobElement.style.transform = `rotate(${rotation}deg)`;
    };

    volSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        updateKnob(volSlider, volKnob);
    });

    const radioSelectors = document.getElementsByName('activeVumeter');
    radioSelectors.forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeVumeter = vumeters.find(v => v.id === e.target.value);
            loadActiveVumeterSettings();
        });
    });

    const loadActiveVumeterSettings = () => {
        const el = activeVumeter.el;
        spacingLeftSlider.value = el.getAttribute('data-spacing-left') || 12;
        spacingRightSlider.value = el.getAttribute('data-spacing-right') || 12;
        heightSlider.value = el.getAttribute('data-vibr-force') || 2;
        
        widthSlider.value = parseInt(el.style.width) || 300;
        const match = el.style.transform.match(/rotate\(([-\d]+)deg\)/);
        rotateSlider.value = match ? match[1] : -10;
    };

    widthSlider.addEventListener('input', (e) => {
        activeVumeter.el.style.width = e.target.value + 'px';
        if (isEditMode && typeof updateExportCode === 'function') updateExportCode();
    });

    const updateContainerHeight = () => {
        const maxS = Math.max(parseFloat(spacingLeftSlider.value), parseFloat(spacingRightSlider.value));
        activeVumeter.el.style.height = (maxS * 8) + 'px';
        activeVumeter.el.setAttribute('data-spacing-left', spacingLeftSlider.value);
        activeVumeter.el.setAttribute('data-spacing-right', spacingRightSlider.value);
        if (isEditMode && typeof updateExportCode === 'function') updateExportCode();
    };

    spacingLeftSlider.addEventListener('input', updateContainerHeight);
    spacingRightSlider.addEventListener('input', updateContainerHeight);

    heightSlider.addEventListener('input', (e) => {
        activeVumeter.el.setAttribute('data-vibr-force', e.target.value);
        if (isEditMode && typeof updateExportCode === 'function') updateExportCode();
    });

    rotateSlider.addEventListener('input', (e) => {
        activeVumeter.el.style.transform = `rotate(${e.target.value}deg)`;
        if (isEditMode && typeof updateExportCode === 'function') updateExportCode();
    });

    textSizeSlider.addEventListener('input', (e) => {
        playSwitch.style.fontSize = e.target.value + 'px';
        document.getElementById('dragVol').style.fontSize = e.target.value + 'px';
        if (isEditMode && typeof updateExportCode === 'function') updateExportCode();
    });

    // Inicializar valores
    updateKnob(volSlider, volKnob);
    audio.volume = volSlider.value;
    
    // Asegurarse de que los 3 vúmetros tengan su altura correcta basada en sus atributos
    vumeters.forEach(v => {
        const sl = parseFloat(v.el.getAttribute('data-spacing-left')) || 12;
        const sr = parseFloat(v.el.getAttribute('data-spacing-right')) || 12;
        v.el.style.height = (Math.max(sl, sr) * 8) + 'px';
    });
    
    loadActiveVumeterSettings();
    
    playSwitch.style.fontSize = textSizeSlider.value + 'px';
    document.getElementById('dragVol').style.fontSize = textSizeSlider.value + 'px';

    // --- Lógica del Vúmetro dentro de la Pastilla (Pickup) ---
    let time = 0;
    const resizeCanvas = () => {
        vumeters.forEach(v => {
            v.canvas.width = v.canvas.offsetWidth;
            v.canvas.height = v.canvas.offsetHeight;
        });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawVumeter = () => {
        time += 0.08;

        vumeters.forEach(vumeter => {
            const canvas = vumeter.canvas;
            const ctx = vumeter.ctx;
            const el = vumeter.el;

            if (canvas.width !== canvas.offsetWidth) canvas.width = canvas.offsetWidth;
            if (canvas.height !== canvas.offsetHeight) canvas.height = canvas.offsetHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const points = Math.max(100, Math.floor(canvas.width / 2));
            const stringsCount = 6;
            const spacingLeft = parseFloat(el.getAttribute('data-spacing-left')) || 12;
            const spacingRight = parseFloat(el.getAttribute('data-spacing-right')) || 12;
            const vibrForce = parseFloat(el.getAttribute('data-vibr-force')) || 2;

            for (let s = 1; s <= stringsCount; s++) {
                const sOffset = (s - 3.5);
                const startY = (canvas.height / 2) + (sOffset * spacingLeft);
                const endY = (canvas.height / 2) + (sOffset * spacingRight);
                
                const stringThickness = 1 + (s * 0.4); 
                
                ctx.beginPath();
                ctx.moveTo(0, startY);
                
                for (let i = 0; i <= points; i++) {
                    const percent = i / points;
                    const x = percent * canvas.width;
                    const baseY = startY + percent * (endY - startY);
                    let y = baseY;
                    
                    if (isPlaying) {
                        const envelope = Math.sin(percent * Math.PI);
                        const speed = 15 - s; 
                        const harmonic1 = Math.sin(x * 0.05 + time * speed);
                        const harmonic2 = Math.cos(x * 0.1 - time * (speed * 1.5));
                        const noise = (Math.random() - 0.5) * 0.5;
                        const chaos = (harmonic1 + harmonic2 + noise) * audio.volume * 20 * vibrForce;
                        y += chaos * envelope;
                    }
                    ctx.lineTo(x, y);
                }
                
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = stringThickness;
                ctx.lineJoin = 'round';
                ctx.shadowBlur = isPlaying ? 5 + (audio.volume * 5) : 3;
                ctx.shadowColor = '#daa520';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(0, startY);
                for (let i = 0; i <= points; i++) {
                    const percent = i / points;
                    const x = percent * canvas.width;
                    const baseY = startY + percent * (endY - startY);
                    let y = baseY;
                    if (isPlaying) {
                        const envelope = Math.sin(percent * Math.PI);
                        const speed = 15 - s; 
                        const harmonic1 = Math.sin(x * 0.05 + time * speed);
                        const harmonic2 = Math.cos(x * 0.1 - time * (speed * 1.5));
                        const noise = (Math.random() - 0.5) * 0.5;
                        const chaos = (harmonic1 + harmonic2 + noise) * audio.volume * 20 * vibrForce;
                        y += chaos * envelope;
                    }
                    ctx.lineTo(x, y);
                }
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = stringThickness * 0.3;
                ctx.shadowBlur = 0;
                ctx.stroke();
            }
        });

        requestAnimationFrame(drawVumeter);
    };

    drawVumeter();

    // Eventos de estado
    audio.addEventListener('playing', () => {
        statusText.textContent = 'ONLINE';
    });
    audio.addEventListener('error', () => {
        statusText.textContent = 'OFFLINE';
        playSwitch.classList.remove('active');
        isPlaying = false;
    });

    // Autoplay automático
    setTimeout(() => toggleAudio(), 500);

    // --- LÓGICA DE MODO EDICIÓN (DRAG & DROP VISUAL) ---
    const editModeBtn = document.getElementById('editModeBtn');
    const exportPanel = document.getElementById('exportPanel');
    const exportCode = document.getElementById('exportCode');
    const closeExport = document.getElementById('closeExport');
    const guitarBody = document.querySelector('.guitar-body');
    
    const streamUrlInput = document.getElementById('streamUrlInput');
    const applyStreamUrl = document.getElementById('applyStreamUrl');
    const streamStatusSpan = document.getElementById('streamStatus');

    // --- Lógica de URL del Stream & Parámetros URL ---
    // Buscar si la URL viene por parámetro en el Iframe (ej: ?stream=https://...)
    const urlParams = new URLSearchParams(window.location.search);
    const streamFromParam = urlParams.get('stream');
    
    // Prioridad: 1. Parámetro de la URL, 2. Guardado en caché, 3. Por defecto
    window.currentStreamUrl = streamFromParam || localStorage.getItem('radioStreamUrl') || 'https://stream.zeno.fm/mfer4shs398uv';

    if (streamFromParam) {
        streamUrlInput.value = streamFromParam;
        streamStatusSpan.textContent = 'URL cargada desde Iframe.';
    } else {
        const savedUrl = localStorage.getItem('radioStreamUrl');
        if (savedUrl) streamUrlInput.value = savedUrl;
    }

    // Buscar si el Logo viene por parámetro en el Iframe (ej: ?logo=https://...)
    const logoFromParam = urlParams.get('logo');
    const stationLogoImg = document.querySelector('.guitar-logo');
    if (logoFromParam && stationLogoImg) {
        stationLogoImg.src = logoFromParam;
    }

    applyStreamUrl.addEventListener('click', () => {
        const newUrl = streamUrlInput.value.trim();
        if (newUrl) {
            localStorage.setItem('radioStreamUrl', newUrl);
            window.currentStreamUrl = newUrl;
            
            streamStatusSpan.textContent = '¡URL Guardada! (Aplica al Iniciar)';
            streamStatusSpan.style.color = '#fff';
            
            if (isPlaying) toggleAudio(); // Apagar si estaba sonando
            
            setTimeout(() => {
                streamStatusSpan.textContent = 'URL guardada en el navegador.';
                streamStatusSpan.style.color = '';
            }, 3000);
            
            if (isEditMode && typeof updateExportCode === 'function') updateExportCode();
        }
    });

    // Elementos arrastrables
    const draggables = [
        { el: vumeters[0].el, name: 'Vúmetro 1' },
        { el: vumeters[1].el, name: 'Vúmetro 2' },
        { el: vumeters[2].el, name: 'Vúmetro 3' },
        { el: document.getElementById('playSwitch'), name: 'Botón Power' },
        { el: document.getElementById('dragVol'), name: 'Perilla Volumen' },
        { el: document.getElementById('dragSocials'), name: 'Redes Sociales' }
    ];

    // Cargar posiciones previas guardadas en el navegador
    draggables.forEach(item => {
        const savedPos = localStorage.getItem('pos_' + item.el.id);
        if (savedPos) {
            const { top, left } = JSON.parse(savedPos);
            item.el.style.top = top;
            item.el.style.left = left;
            item.el.style.bottom = 'auto';
            item.el.style.right = 'auto';
        }
    });

    const updateExportCode = () => {
        let code = '';
        draggables.forEach(item => {
            let styleStr = `top: ${item.el.style.top}; left: ${item.el.style.left};`;
            if (item.el.id.startsWith('dragVumeter')) {
                if (item.el.style.transform) styleStr += ` transform: ${item.el.style.transform};`;
                if (item.el.style.width) styleStr += ` width: ${item.el.style.width};`;
                if (item.el.style.height) styleStr += ` height: ${item.el.style.height};`;
                
                const sl = item.el.getAttribute('data-spacing-left');
                const sr = item.el.getAttribute('data-spacing-right');
                const vf = item.el.getAttribute('data-vibr-force');
                code += `<!-- ${item.name} -->\nstyle="${styleStr}"\ndata-spacing-left="${sl}" data-spacing-right="${sr}" data-vibr-force="${vf}"\n\n`;
            } else {
                if (item.el.style.fontSize) {
                    styleStr += ` font-size: ${item.el.style.fontSize};`;
                }
                code += `<!-- ${item.name} -->\nstyle="${styleStr}"\n\n`;
            }
        });
        
        // Exportar también la etiqueta de audio con la URL actual
        const finalUrl = streamFromParam ? 'https://TU_RADIO.com/stream' : (streamUrlInput.value || 'https://stream.zeno.fm/mfer4shs398uv');
        code += `<!-- Etiqueta de Audio -->\n`;
        code += `<audio id="audioElement">\n  <source src="${finalUrl}" type="audio/mpeg">\n</audio>\n`;
        
        exportCode.textContent = code;
    };

    editModeBtn.addEventListener('click', () => {
        isEditMode = true;
        guitarBody.classList.add('edit-mode-active');
        exportPanel.style.display = 'block';
        updateExportCode();
    });

    closeExport.addEventListener('click', () => {
        isEditMode = false;
        guitarBody.classList.remove('edit-mode-active');
        exportPanel.style.display = 'none';
    });

    // Lógica Drag and Drop
    draggables.forEach(item => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        item.el.addEventListener('mousedown', (e) => {
            if (!isEditMode) return;
            
            isDragging = true;
            isDraggingAction = false; // Reiniciamos la detección
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = item.el.getBoundingClientRect();
            const parentRect = guitarBody.getBoundingClientRect();
            
            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            // Si nos movemos más de unos pocos píxeles, consideramos que es un arrastre real
            if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
                isDraggingAction = true;
            }
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const parentRect = guitarBody.getBoundingClientRect();
            
            // Convertir a porcentajes
            const newLeft = ((initialLeft + dx) / parentRect.width) * 100;
            const newTop = ((initialTop + dy) / parentRect.height) * 100;
            
            item.el.style.left = newLeft.toFixed(2) + '%';
            item.el.style.top = newTop.toFixed(2) + '%';
            item.el.style.bottom = 'auto';
            item.el.style.right = 'auto';
            
            updateExportCode();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // Guardar automáticamente en el navegador
                localStorage.setItem('pos_' + item.el.id, JSON.stringify({
                    top: item.el.style.top,
                    left: item.el.style.left
                }));
            }
        });
    });
});
