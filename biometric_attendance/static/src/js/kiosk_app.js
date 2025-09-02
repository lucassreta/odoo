class BiometricKioskApp {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.stream = null;
        this.modelsLoaded = false;
        this.isProcessing = false;
        this.autoCapture = false;
        this.lastRecognition = 0;
        this.detectionInterval = null;
        
        // Configuración
        this.config = {
            videoConstraints: {
                width: 640,
                height: 480,
                facingMode: 'user'
            },
            recognitionThreshold: 0.6,
            minConfidence: 0.75,
            autoCapturDelay: 2000,
            resetDelay: 5000
        };
        
        this.init();
    }
    
    async init() {
        console.log('Inicializando Kiosco Biométrico...');
        
        // Mostrar loading
        this.showLoading();
        
        try {
            // Cargar modelos de Face-API
            await this.loadFaceApiModels();
            
            // Inicializar elementos DOM
            this.initializeElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Actualizar reloj
            this.startClock();
            
            // Cargar estadísticas
            await this.loadStats();
            
            // Ocultar loading y mostrar app
            this.hideLoading();
            
            console.log('Kiosco inicializado correctamente');
            
        } catch (error) {
            console.error('Error inicializando kiosco:', error);
            this.showError('Error al inicializar el sistema biométrico');
        }
    }
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('main_app').style.display = 'none';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main_app').style.display = 'block';
    }
    
    async loadFaceApiModels() {
        const MODEL_URL = '/biometric_attendance/static/models';
        
        console.log('Cargando modelos Face-API...');
        
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            
            this.modelsLoaded = true;
            console.log('Modelos cargados correctamente');
            
        } catch (error) {
            console.error('Error cargando modelos:', error);
            // Fallback: marcar como cargado para demo
            this.modelsLoaded = true;
        }
    }
    
    initializeElements() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        
        // Configurar canvas del mismo tamaño que video
        this.canvas.width = this.config.videoConstraints.width;
        this.canvas.height = this.config.videoConstraints.height;
    }
    
    setupEventListeners() {
        // Botones de control
        document.getElementById('start_camera').addEventListener('click', () => this.startCamera());
        document.getElementById('capture_face').addEventListener('click', () => this.captureAndRecognize());
        document.getElementById('reset_camera').addEventListener('click', () => this.resetCamera());
        
        // Video loaded
        this.video.addEventListener('loadedmetadata', () => {
            console.log('Video cargado:', this.video.videoWidth, 'x', this.video.videoHeight);
        });
        
        // Detección de errores de video
        this.video.addEventListener('error', (e) => {
            console.error('Error en video:', e);
            this.updateStatus('Error en la cámara', 'error');
        });
    }
    
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Argentina/Buenos_Aires'
        };
        
        const timeString = now.toLocaleDateString('es-AR', options);
        const clockElement = document.getElementById('kiosk_clock');
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }
    
    async startCamera() {
        try {
            this.updateStatus('Iniciando cámara...', 'info');
            
            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: this.config.videoConstraints,
                audio: false
            });
            
            this.video.srcObject = this.stream;
            await this.video.play();
            
            // Actualizar controles
            document.getElementById('start_camera').style.display = 'none';
            document.getElementById('capture_face').style.display = 'inline-block';
            document.getElementById('reset_camera').style.display = 'inline-block';
            
            this.updateStatus('Cámara activa - Posicione su rostro', 'success');
            
            // Iniciar detección automática
            this.startAutoDetection();
            
        } catch (error) {
            console.error('Error accediendo a cámara:', error);
            this.updateStatus('Error al acceder a la cámara', 'error');
            this.showCameraError(error);
        }
    }
    
    startAutoDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        
        this.detectionInterval = setInterval(async () => {
            if (!this.isProcessing && this.modelsLoaded) {
                await this.detectFaceInVideo();
            }
        }, 500); // Verificar cada 500ms
    }
    
    async detectFaceInVideo() {
        if (!this.video || this.video.readyState !== 4) return;
        
        try {
            const detection = await faceapi
                .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (detection) {
                this.showFaceOverlay(detection.detection.box);
                
                // Auto-captura si hay buena detección
                const now = Date.now();
                if (now - this.lastRecognition > this.config.autoCapturDelay) {
                    this.updateStatus('Rostro detectado - Procesando...', 'info');
                    await this.processRecognition(detection);
                }
            } else {
                this.hideFaceOverlay();
            }
            
        } catch (error) {
            console.error('Error en detección:', error);
        }
    }
    
    showFaceOverlay(box) {
        const overlay = document.getElementById('face_overlay');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.left = `${box.x}px`;
            overlay.style.top = `${box.y}px`;
            overlay.style.width = `${box.width}px`;
            overlay.style.height = `${box.height}px`;
        }
    }
    
    hideFaceOverlay() {
        const overlay = document.getElementById('face_overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    async captureAndRecognize() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateStatus('Procesando reconocimiento...', 'info');
        
        try {
            // Capturar frame actual
            const detection = await faceapi
                .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (detection) {
                await this.processRecognition(detection);
            } else {
                this.updateStatus('No se detectó rostro. Intente nuevamente.', 'warning');
            }
            
        } catch (error) {
            console.error('Error en captura:', error);
            this.updateStatus('Error procesando imagen', 'error');
        } finally {
            this.isProcessing = false;
        }
    }
    
    async processRecognition(detection) {
        try {
            // Extraer descriptor facial
            const faceDescriptor = Array.from(detection.descriptor);
            
            // Capturar imagen para referencia
            this.canvas.getContext('2d').drawImage(this.video, 0, 0);
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Enviar al servidor para verificación
            const verificationResult = await this.verifyFaceWithServer(faceDescriptor);
            
            if (verificationResult.success) {
                await this.handleSuccessfulRecognition(verificationResult, imageData);
            } else {
                this.handleFailedRecognition(verificationResult.message);
            }
            
            this.lastRecognition = Date.now();
            
        } catch (error) {
            console.error('Error en procesamiento:', error);
            this.updateStatus('Error en el reconocimiento', 'error');
        }
    }
    
    async verifyFaceWithServer(faceDescriptor) {
        try {
            const response = await fetch('/kiosk/api/verify_face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        face_data: faceDescriptor
                    }
                })
            });
            
            const data = await response.json();
            return data.result || data;
            
        } catch (error) {
            console.error('Error comunicándose con servidor:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }
    
    async handleSuccessfulRecognition(result, imageData) {
        // Obtener información completa del empleado
        const employeeInfo = await this.getEmployeeInfo(result.employee_id);
        
        // Crear registro de asistencia
        const attendanceResult = await this.createAttendance(
            result.employee_id, 
            result.confidence,
            this.getDeviceInfo()
        );
        
        if (attendanceResult.success) {
            this.showEmployeeSuccess(employeeInfo.employee, attendanceResult, result.confidence);
            await this.loadStats(); // Actualizar estadísticas
        } else {
            this.updateStatus('Error registrando asistencia', 'error');
        }
    }
    
    async getEmployeeInfo(employeeId) {
        try {
            const response = await fetch('/kiosk/api/employee_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        employee_id: employeeId
                    }
                })
            });
            
            const data = await response.json();
            return data.result || data;
            
        } catch (error) {
            console.error('Error obteniendo info empleado:', error);
            return { success: false };
        }
    }
    
    async createAttendance(employeeId, confidence, deviceInfo) {
        try {
            const response = await fetch('/kiosk/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        employee_id: employeeId,
                        confidence: confidence,
                        device_info: JSON.stringify(deviceInfo)
                    }
                })
            });
            
            const data = await response.json();
            return data.result || data;
            
        } catch (error) {
            console.error('Error creando asistencia:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString(),
            language: navigator.language,
            platform: navigator.platform
        };
    }
    
    showEmployeeSuccess(employee, attendanceResult, confidence) {
        // Actualizar información del empleado
        document.getElementById('employee_name').textContent = employee.name;
        document.getElementById('employee_dept').textContent = employee.department || employee.job_position || '';
        
        // Mostrar foto si existe
        const photoElement = document.getElementById('employee_photo');
        if (employee.image) {
            photoElement.style.backgroundImage = `url(${employee.image})`;
        } else {
            photoElement.style.backgroundImage = 'none';
            photoElement.innerHTML = '<i class="fas fa-user fa-3x"></i>';
        }
        
        // Mostrar acción de asistencia
        const actionElement = document.getElementById('attendance_action');
        const isCheckIn = attendanceResult.action === 'check_in';
        actionElement.textContent = isCheckIn ? 'ENTRADA' : 'SALIDA';
        actionElement.className = `attendance_action ${isCheckIn ? 'check_in' : 'check_out'}`;
        
        // Mostrar hora
        const timeElement = document.getElementById('attendance_time');
        timeElement.textContent = new Date(attendanceResult.time).toLocaleString('es-AR');
        
        // Mostrar nivel de confianza
        const confidenceElement = document.getElementById('confidence_score');
        const confidencePercent = Math.round(confidence * 100);
        confidenceElement.innerHTML = `
            <div class="confidence_bar">
                <div class="confidence_fill" style="width: ${confidencePercent}%"></div>
            </div>
            <span>Confianza: ${confidencePercent}%</span>
        `;
        
        // Mostrar sección de empleado
        document.getElementById('employee_info').style.display = 'block';
        
        // Actualizar status
        this.updateStatus('¡Asistencia registrada correctamente!', 'success');
        
        // Auto-reset después de 5 segundos
        setTimeout(() => {
            this.resetDisplay();
        }, this.config.resetDelay);
    }
    
    handleFailedRecognition(message) {
        this.updateStatus(message || 'Rostro no reconocido', 'error');
        
        // Reset después de 3 segundos
        setTimeout(() => {
            this.updateStatus('Listo para reconocimiento', 'ready');
        }, 3000);
    }
    
    resetDisplay() {
        document.getElementById('employee_info').style.display = 'none';
        this.updateStatus('Listo para reconocimiento', 'ready');
        this.hideFaceOverlay();
    }
    
    resetCamera() {
        // Detener stream actual
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Limpiar intervalos
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        // Resetear controles
        document.getElementById('start_camera').style.display = 'inline-block';
        document.getElementById('capture_face').style.display = 'none';
        document.getElementById('reset_camera').style.display = 'none';
        
        // Resetear display
        this.resetDisplay();
        
        this.isProcessing = false;
    }
    
    async loadStats() {
        try {
            // Simular carga de estadísticas
            // En implementación real, hacer petición al servidor
            const stats = {
                today_attendances: Math.floor(Math.random() * 50) + 10,
                unique_employees: Math.floor(Math.random() * 20) + 5
            };
            
            document.getElementById('total_attendances').textContent = stats.today_attendances;
            document.getElementById('unique_employees').textContent = stats.unique_employees;
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }
    
    updateStatus(message, type) {
        const statusElement = document.getElementById('recognition_status');
        if (statusElement) {
            const iconMap = {
                ready: 'fa-clock',
                success: 'fa-check-circle',
                error: 'fa-exclamation-triangle',
                warning: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };
            
            const icon = iconMap[type] || 'fa-clock';
            statusElement.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
            statusElement.className = `status_display status_${type}`;
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error_overlay';
        errorDiv.innerHTML = `
            <div class="error_content">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Error del Sistema</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Reiniciar
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    showCameraError(error) {
        let message = 'Error desconocido al acceder a la cámara';
        
        if (error.name === 'NotAllowedError') {
            message = 'Acceso a la cámara denegado. Por favor, permita el acceso y recargue la página.';
        } else if (error.name === 'NotFoundError') {
            message = 'No se encontró ninguna cámara en este dispositivo.';
        } else if (error.name === 'NotSupportedError') {
            message = 'La cámara no es compatible con este navegador.';
        } else if (error.name === 'NotReadableError') {
            message = 'La cámara está siendo utilizada por otra aplicación.';
        }
        
        this.showError(message);
    }
}
