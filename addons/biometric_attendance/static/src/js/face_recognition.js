// Sistema de reconocimiento facial para kiosco biométrico
// Compatible con Odoo 17 - JavaScript puro sin dependencias

(function() {
    'use strict';
    
    console.log('🎯 Cargando sistema biométrico...');
    
    window.BiometricKiosk = {
        video: null,
        canvas: null,
        stream: null,
        faceapi_loaded: false,
        models_loaded: false,
        initialized: false,

        init: function() {
            if (this.initialized) {
                console.log('⚠️ Sistema ya inicializado');
                return;
            }
            
            console.log('🚀 Inicializando sistema biométrico...');
            this.initialized = true;
            
            // Inicializar cuando el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.start.bind(this));
            } else {
                this.start();
            }
        },

        start: function() {
            console.log('▶️ Iniciando sistema biométrico...');
            
            // Verificar si estamos en la página del kiosco
            if (!document.getElementById('start_camera')) {
                console.log('ℹ️ No es página de kiosco, saltando inicialización');
                return;
            }
            
            console.log('✅ Página de kiosco detectada');
            
            // Inicializar reloj
            this.updateClock();
            setInterval(this.updateClock.bind(this), 1000);
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Cargar face-api.js
            this.loadFaceAPI().then(() => {
                this.initializeElements();
            });
        },

        setupEventListeners: function() {
            var self = this;
            console.log('🔗 Configurando event listeners...');
            
            // Event listeners para botones del kiosco
            var startBtn = document.getElementById('start_camera');
            var captureBtn = document.getElementById('capture_face');
            var adminBtn = document.getElementById('admin_settings');
            
            if (startBtn) {
                console.log('✅ Botón iniciar cámara encontrado');
                startBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('🎬 Click en iniciar cámara');
                    self.startCamera();
                });
            } else {
                console.error('❌ Botón iniciar cámara NO encontrado');
            }
            
            if (captureBtn) {
                console.log('✅ Botón capturar encontrado');
                captureBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('📸 Click en capturar');
                    self.captureAndRecognize();
                });
            }
            
            if (adminBtn) {
                adminBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.showAdminSettings();
                });
            }
        },

        loadFaceAPI: function() {
            var self = this;
            console.log('📦 Cargando Face-API.js...');
            
            return new Promise(function(resolve) {
                // Verificar si ya está cargado
                if (typeof faceapi !== 'undefined') {
                    console.log('✅ Face-API ya está cargado');
                    self.faceapi_loaded = true;
                    self.loadModels().then(resolve);
                    return;
                }
                
                // Cargar face-api.js desde CDN
                var script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/face-api.min.js';
                script.onload = function() {
                    console.log('✅ Face-API.js cargado exitosamente');
                    self.faceapi_loaded = true;
                    self.loadModels().then(resolve);
                };
                script.onerror = function() {
                    console.error('❌ Error cargando Face-API.js');
                    resolve();
                };
                document.head.appendChild(script);
            });
        },

        loadModels: function() {
            var self = this;
            console.log('🧠 Cargando modelos de IA...');
            
            if (typeof faceapi === 'undefined') {
                console.error('❌ Face-API.js no está disponible');
                return Promise.resolve();
            }

            return Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/biometric_attendance/static/models/'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/biometric_attendance/static/models/'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/biometric_attendance/static/models/')
            ]).then(function() {
                self.models_loaded = true;
                console.log('✅ Modelos de IA cargados correctamente');
            }).catch(function(error) {
                console.error('❌ Error cargando modelos:', error);
                console.log('ℹ️ Los modelos son opcionales para demostración');
            });
        },

        initializeElements: function() {
            console.log('🎯 Inicializando elementos DOM...');
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            
            if (!this.video) {
                console.error('❌ Elemento video no encontrado');
            } else {
                console.log('✅ Elemento video encontrado');
            }
            
            if (!this.canvas) {
                console.error('❌ Elemento canvas no encontrado');
            } else {
                console.log('✅ Elemento canvas encontrado');
            }
        },

        updateClock: function() {
            var now = new Date();
            var timeString = now.toLocaleString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            var clockElement = document.getElementById('kiosk_clock');
            if (clockElement) {
                clockElement.textContent = timeString;
            }
        },

        startCamera: function() {
            var self = this;
            
            console.log('🎬 === INICIANDO CÁMARA ===');
            
            // Verificar si getUserMedia está disponible
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('❌ getUserMedia no está disponible en este navegador');
                self.updateStatus('Navegador no compatible con acceso a cámara', 'error');
                return;
            }

            // Información del navegador
            console.log('🌐 Navegador:', navigator.userAgent);
            console.log('🔗 URL:', window.location.href);
            console.log('🔒 Protocolo:', window.location.protocol);

            // Verificar si estamos en HTTPS (requerido para cámara)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                console.warn('⚠️ Se recomienda HTTPS para acceso a cámara');
            }

            self.updateStatus('Solicitando acceso a cámara...', 'info');
            
            // Configuración más flexible para cámara
            var constraints = {
                video: {
                    width: { ideal: 640, min: 320 },
                    height: { ideal: 480, min: 240 },
                    facingMode: { ideal: 'user' }
                },
                audio: false
            };

            console.log('📋 Restricciones de cámara:', constraints);

            navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                console.log('✅ ¡Cámara accedida exitosamente!');
                console.log('📺 Stream obtenido:', stream);
                console.log('🎥 Video tracks:', stream.getVideoTracks());
                
                self.stream = stream;
                
                // Verificar que tenemos un elemento video
                if (!self.video) {
                    console.error('❌ Elemento video no encontrado');
                    self.updateStatus('Error: elemento video no encontrado', 'error');
                    return;
                }
                
                self.video.srcObject = stream;
                
                // Manejar cuando el video está listo
                self.video.onloadedmetadata = function() {
                    console.log('📊 Video metadata cargada:', {
                        width: self.video.videoWidth,
                        height: self.video.videoHeight
                    });
                    
                    self.video.play().then(function() {
                        console.log('▶️ Video reproduciéndose correctamente');
                        
                        // Mostrar botón de captura
                        var startBtn = document.getElementById('start_camera');
                        var captureBtn = document.getElementById('capture_face');
                        
                        if (startBtn) startBtn.style.display = 'none';
                        if (captureBtn) captureBtn.style.display = 'inline-block';
                        
                        self.updateStatus('¡Cámara iniciada correctamente! Posicione su rostro', 'success');
                        
                    }).catch(function(playError) {
                        console.error('❌ Error reproduciendo video:', playError);
                        self.updateStatus('Error reproduciendo video: ' + playError.message, 'error');
                    });
                };
                
                self.video.onerror = function(videoError) {
                    console.error('❌ Error en elemento video:', videoError);
                    self.updateStatus('Error en elemento video', 'error');
                };
                
            })
            .catch(function(error) {
                console.error('❌ === ERROR ACCEDIENDO A CÁMARA ===');
                console.error('Tipo de error:', error.name);
                console.error('Mensaje:', error.message);
                console.error('Error completo:', error);
                
                var userFriendlyMessage = 'Error al acceder a la cámara';
                
                switch(error.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        userFriendlyMessage = '🚫 Permisos denegados. Permite el acceso a la cámara y recarga la página';
                        break;
                    case 'NotFoundError':
                    case 'DevicesNotFoundError':
                        userFriendlyMessage = '📷 No se detectó ninguna cámara en este dispositivo';
                        break;
                    case 'NotReadableError':
                    case 'TrackStartError':
                        userFriendlyMessage = '🔒 La cámara está siendo utilizada por otra aplicación';
                        break;
                    case 'OverconstrainedError':
                    case 'ConstraintNotSatisfiedError':
                        userFriendlyMessage = '⚙️ La configuración de cámara solicitada no es compatible';
                        break;
                    case 'NotSupportedError':
                        userFriendlyMessage = '🌐 Este navegador no soporta acceso a cámara';
                        break;
                    case 'SecurityError':
                        userFriendlyMessage = '🔐 Error de seguridad. ¿Estás usando HTTPS?';
                        break;
                    default:
                        userFriendlyMessage = '❌ Error: ' + error.message;
                }
                
                self.updateStatus(userFriendlyMessage, 'error');
                self.showCameraDebugInfo();
            });
        },
        
        showCameraDebugInfo: function() {
            console.log('🔍 === INFORMACIÓN DE DIAGNÓSTICO ===');
            console.log('🌐 URL actual:', window.location.href);
            console.log('🔒 Protocolo:', window.location.protocol);
            console.log('💻 Sistema:', {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            });
            
            if (navigator.mediaDevices) {
                console.log('✅ MediaDevices disponible');
                
                if (navigator.mediaDevices.enumerateDevices) {
                    navigator.mediaDevices.enumerateDevices()
                    .then(function(devices) {
                        console.log('📱 Dispositivos encontrados:');
                        devices.forEach(function(device, index) {
                            console.log(`${index}: ${device.kind} - ${device.label || 'Sin nombre'}`);
                        });
                    })
                    .catch(function(err) {
                        console.log('❌ Error enumerando dispositivos:', err);
                    });
                }
                
                if (navigator.mediaDevices.getSupportedConstraints) {
                    console.log('⚙️ Restricciones soportadas:', navigator.mediaDevices.getSupportedConstraints());
                }
            } else {
                console.log('❌ MediaDevices NO disponible');
            }
        },

        captureAndRecognize: function() {
            console.log('📸 Iniciando captura y reconocimiento');
            this.updateStatus('Función de reconocimiento activada - Demo mode', 'info');
            
            // Por ahora solo mostrar mensaje de éxito para prueba
            setTimeout(() => {
                this.updateStatus('¡Cámara funcionando correctamente!', 'success');
            }, 2000);
        },

        updateStatus: function(message, type) {
            console.log(`📊 Status [${type}]: ${message}`);
            var statusElement = document.getElementById('recognition_status');
            if (statusElement) {
                statusElement.innerHTML = `<span>${message}</span>`;
                statusElement.className = 'status_display status_' + type;
            }
        },

        showAdminSettings: function() {
            console.log('⚙️ Configuraciones de administrador');
            this.updateStatus('Panel de administración - En desarrollo', 'info');
        }
    };

    // Auto-inicializar
    console.log('🎯 Auto-inicializando sistema biométrico...');
    window.BiometricKiosk.init();

})();