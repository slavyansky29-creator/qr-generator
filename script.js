// QR Generator - Минимальная, стабильная версия
(function() {
    'use strict';
    
    // Проверяем, загружены ли необходимые библиотеки
    function checkDependencies() {
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            showMessage('Ошибка: Библиотека QRCode не загружена. Пожалуйста, обновите страницу или проверьте подключение к интернету.', 'danger');
            return false;
        }
        return true;
    }
    
    // Основной класс приложения
    class QRGenerator {
        constructor() {
            this.currentQR = {
                data: '',
                type: 'url',
                logo: null,
                color: '#000000',
                bgColor: '#FFFFFF',
                size: 400
            };
            
            this.init();
        }
        
        init() {
            console.log('QR Generator: Инициализация');
            
            // Проверяем зависимости
            if (!checkDependencies()) {
                return;
            }
            
            // Находим элементы
            this.elements = {
                urlInput: document.getElementById('urlInput'),
                textInput: document.getElementById('textInput'),
                qrSize: document.getElementById('qrSize'),
                sizeValue: document.getElementById('sizeValue'),
                qrColor: document.getElementById('qrColor'),
                bgColor: document.getElementById('bgColor'),
                generateBtn: document.getElementById('generateBtn'),
                qrPreview: document.getElementById('qrPreview'),
                noQrMessage: document.getElementById('noQrMessage'),
                downloadSection: document.getElementById('downloadSection'),
                downloadBtns: document.querySelectorAll('.download-btn'),
                contentTypeRadios: document.querySelectorAll('input[name="contentType"]'),
                forms: {
                    url: document.getElementById('urlForm'),
                    text: document.getElementById('textForm'),
                    files: document.getElementById('filesForm'),
                    media: document.getElementById('mediaForm')
                },
                mediaUploads: {
                    image: document.getElementById('imageUpload'),
                    video: document.getElementById('videoUpload')
                },
                mediaBoxes: {
                    image: document.getElementById('imageUploadBox'),
                    video: document.getElementById('videoUploadBox')
                }
            };
            
            // Настраиваем обработчики событий
            this.setupEventListeners();
            
            // Устанавливаем начальные значения
            this.updateSizeDisplay();
            
            // Заполняем демо-данные
            if (this.elements.urlInput) this.elements.urlInput.value = 'https://github.com';
            if (this.elements.textInput) this.elements.textInput.value = 'Добро пожаловать в QR генератор!';
            
            // Генерируем демо QR-код
            setTimeout(() => this.generateDemoQR(), 500);
        }
        
        setupEventListeners() {
            // Переключение типа контента
            this.elements.contentTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => this.switchContentType(e.target.value));
            });
            
            // Обновление размера
            if (this.elements.qrSize) {
                this.elements.qrSize.addEventListener('input', () => this.updateSizeDisplay());
            }
            
            // Обновление цветов
            if (this.elements.qrColor) {
                this.elements.qrColor.addEventListener('input', (e) => {
                    this.currentQR.color = e.target.value;
                });
            }
            
            if (this.elements.bgColor) {
                this.elements.bgColor.addEventListener('input', (e) => {
                    this.currentQR.bgColor = e.target.value;
                });
            }
            
            // Кнопка генерации
            if (this.elements.generateBtn) {
                this.elements.generateBtn.addEventListener('click', () => this.generateQR());
            }
            
            // Кнопки скачивания
            this.elements.downloadBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const format = e.currentTarget.getAttribute('data-format');
                    this.downloadQR(format);
                });
            });
            
            // Загрузка медиа файлов
            if (this.elements.mediaBoxes.image) {
                this.elements.mediaBoxes.image.addEventListener('click', () => {
                    this.elements.mediaUploads.image.click();
                });
            }
            
            if (this.elements.mediaBoxes.video) {
                this.elements.mediaBoxes.video.addEventListener('click', () => {
                    this.elements.mediaUploads.video.click();
                });
            }
            
            if (this.elements.mediaUploads.image) {
                this.elements.mediaUploads.image.addEventListener('change', (e) => {
                    this.handleMediaUpload(e, 'image');
                });
            }
            
            if (this.elements.mediaUploads.video) {
                this.elements.mediaUploads.video.addEventListener('change', (e) => {
                    this.handleMediaUpload(e, 'video');
                });
            }
            
            // Drag & drop для файлов
            const dropzone = document.getElementById('dropzoneArea');
            if (dropzone) {
                dropzone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropzone.style.borderColor = '#3498db';
                    dropzone.style.background = 'rgba(52, 152, 219, 0.1)';
                });
                
                dropzone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    dropzone.style.borderColor = '#3498db';
                    dropzone.style.background = 'rgba(52, 152, 219, 0.05)';
                });
                
                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    this.handleFileDrop(e.dataTransfer.files);
                });
                
                dropzone.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => this.handleFileDrop(e.target.files);
                    input.click();
                });
            }
        }
        
        switchContentType(type) {
            this.currentQR.type = type;
            
            // Скрываем все формы
            Object.values(this.elements.forms).forEach(form => {
                if (form) form.style.display = 'none';
            });
            
            // Показываем активную форму
            if (this.elements.forms[type]) {
                this.elements.forms[type].style.display = 'block';
            }
        }
        
        updateSizeDisplay() {
            if (this.elements.qrSize && this.elements.sizeValue) {
                const size = this.elements.qrSize.value;
                this.elements.sizeValue.textContent = size;
                this.currentQR.size = parseInt(size);
            }
        }
        
        generateDemoQR() {
            try {
                this.currentQR.data = 'https://github.com';
                this.generateQRCode('https://github.com');
                showMessage('Демо QR-код успешно создан! Попробуйте изменить настройки и сгенерировать свой.', 'success');
            } catch (error) {
                console.error('Ошибка генерации демо QR-кода:', error);
                showMessage('Не удалось создать демо QR-код. Проверьте консоль браузера для подробностей.', 'danger');
            }
        }
        
        generateQR() {
            // Получаем данные в зависимости от типа
            let data;
            try {
                switch(this.currentQR.type) {
                    case 'url':
                        data = this.elements.urlInput.value.trim();
                        if (!data) throw new Error('Введите URL адрес');
                        if (!this.isValidUrl(data)) throw new Error('Некорректный URL адрес');
                        break;
                    case 'text':
                        data = this.elements.textInput.value.trim();
                        if (!data) throw new Error('Введите текст для QR-кода');
                        break;
                    case 'files':
                        data = 'QR код для файлов';
                        break;
                    case 'media':
                        data = 'QR код для медиа';
                        break;
                    default:
                        data = 'QR Code';
                }
            } catch (error) {
                showMessage('Ошибка: ' + error.message, 'danger');
                return;
            }
            
            this.currentQR.data = data;
            
            // Показываем индикатор загрузки
            const originalText = this.elements.generateBtn.innerHTML;
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
            
            // Генерируем QR-код
            try {
                this.generateQRCode(data);
                
                // Показываем секцию скачивания
                if (this.elements.downloadSection) {
                    this.elements.downloadSection.style.display = 'block';
                }
                if (this.elements.noQrMessage) {
                    this.elements.noQrMessage.style.display = 'none';
                }
                
                showMessage('QR-код успешно сгенерирован!', 'success');
            } catch (error) {
                console.error('Ошибка генерации:', error);
                showMessage('Ошибка генерации QR-кода: ' + error.message, 'danger');
            } finally {
                this.elements.generateBtn.disabled = false;
                this.elements.generateBtn.innerHTML = originalText;
            }
        }
        
        generateQRCode(data) {
            return new Promise((resolve, reject) => {
                try {
                    // Очищаем контейнер предпросмотра
                    if (this.elements.qrPreview) {
                        this.elements.qrPreview.innerHTML = '';
                    }
                    
                    const size = this.currentQR.size;
                    const fgColor = this.currentQR.color;
                    const bgColor = this.currentQR.bgColor;
                    
                    // Используем библиотеку QRCode
                    QRCode.toCanvas(
                        data,
                        {
                            width: size,
                            margin: 2,
                            color: {
                                dark: fgColor,
                                light: bgColor
                            },
                            errorCorrectionLevel: 'H'
                        },
                        (err, canvas) => {
                            if (err) {
                                reject(new Error('Ошибка библиотеки QRCode: ' + err.message));
                                return;
                            }
                            
                            canvas.id = 'qrCanvas';
                            canvas.style.display = 'block';
                            canvas.style.maxWidth = '100%';
                            canvas.style.height = 'auto';
                            
                            if (this.elements.qrPreview) {
                                this.elements.qrPreview.appendChild(canvas);
                            }
                            
                            resolve(canvas);
                        }
                    );
                } catch (error) {
                    reject(new Error('Ошибка при создании QR-кода: ' + error.message));
                }
            });
        }
        
        handleMediaUpload(event, type) {
            const files = event.target.files;
            if (!files.length) return;
            
            const previewContainer = document.getElementById('mediaPreview');
            if (!previewContainer) return;
            
            // Очищаем старые превью
            previewContainer.innerHTML = '';
            
            // Показываем превью для каждого файла
            Array.from(files).forEach(file => {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-3';
                
                if (type === 'image' && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        col.innerHTML = `
                            <div class="card">
                                <img src="${e.target.result}" class="card-img-top" alt="${file.name}" style="height: 100px; object-fit: cover;">
                                <div class="card-body p-2">
                                    <small class="card-text">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</small>
                                    <small class="text-muted d-block">${this.formatFileSize(file.size)}</small>
                                </div>
                            </div>
                        `;
                    }.bind(this);
                    reader.readAsDataURL(file);
                } else if (type === 'video' && file.type.startsWith('video/')) {
                    col.innerHTML = `
                        <div class="card">
                            <div class="card-body text-center" style="height: 100px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-video fa-3x text-muted"></i>
                            </div>
                            <div class="card-body p-2">
                                <small class="card-text">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</small>
                                <small class="text-muted d-block">${this.formatFileSize(file.size)}</small>
                            </div>
                        </div>
                    `;
                }
                
                previewContainer.appendChild(col);
            });
            
            showMessage(`Загружено ${files.length} ${type === 'image' ? 'изображений' : 'видео'}`, 'success');
        }
        
        handleFileDrop(files) {
            if (!files.length) return;
            
            const filePreview = document.getElementById('filePreview');
            if (!filePreview) return;
            
            // Очищаем старые превью
            filePreview.innerHTML = '';
            
            Array.from(files).slice(0, 10).forEach(file => {
                const previewItem = document.createElement('div');
                previewItem.className = 'file-preview-item';
                
                const icon = this.getFileIcon(file.name);
                const size = this.formatFileSize(file.size);
                
                previewItem.innerHTML = `
                    <i class="${icon}"></i>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${size}</div>
                    </div>
                `;
                
                filePreview.appendChild(previewItem);
            });
            
            showMessage(`Загружено ${Math.min(files.length, 10)} файлов`, 'success');
        }
        
        downloadQR(format) {
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) {
                showMessage('Сначала сгенерируйте QR-код', 'warning');
                return;
            }
            
            try {
                let mimeType, extension;
                switch(format) {
                    case 'png':
                        mimeType = 'image/png';
                        extension = 'png';
                        break;
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        extension = 'jpg';
                        break;
                    case 'svg':
                        // Простая SVG реализация
                        const svgContent = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="${this.currentQR.size}" height="${this.currentQR.size}">
                                <foreignObject width="100%" height="100%">
                                    <div xmlns="http://www.w3.org/1999/xhtml">
                                        <img src="${canvas.toDataURL('image/png')}" width="100%" height="100%"/>
                                    </div>
                                </foreignObject>
                            </svg>`;
                        
                        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
                        const svgUrl = URL.createObjectURL(svgBlob);
                        const svgLink = document.createElement('a');
                        svgLink.href = svgUrl;
                        svgLink.download = `qr-code-${Date.now()}.svg`;
                        document.body.appendChild(svgLink);
                        svgLink.click();
                        document.body.removeChild(svgLink);
                        URL.revokeObjectURL(svgUrl);
                        
                        showMessage('QR-код скачан в формате SVG!', 'success');
                        return;
                        
                    default:
                        mimeType = 'image/png';
                        extension = 'png';
                }
                
                const dataUrl = canvas.toDataURL(mimeType);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `qr-code-${Date.now()}.${extension}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showMessage(`QR-код скачан в формате ${format.toUpperCase()}!`, 'success');
            } catch (error) {
                showMessage('Ошибка при скачивании: ' + error.message, 'danger');
            }
        }
        
        // Вспомогательные методы
        isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        }
        
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const icons = {
                'pdf': 'fas fa-file-pdf',
                'doc': 'fas fa-file-word',
                'docx': 'fas fa-file-word',
                'txt': 'fas fa-file-alt',
                'jpg': 'fas fa-file-image',
                'jpeg': 'fas fa-file-image',
                'png': 'fas fa-file-image',
                'gif': 'fas fa-file-image',
                'mp4': 'fas fa-file-video',
                'avi': 'fas fa-file-video',
                'mov': 'fas fa-file-video',
                'zip': 'fas fa-file-archive',
                'rar': 'fas fa-file-archive',
                '7z': 'fas fa-file-archive',
                'xls': 'fas fa-file-excel',
                'xlsx': 'fas fa-file-excel',
                'ppt': 'fas fa-file-powerpoint',
                'pptx': 'fas fa-file-powerpoint'
            };
            return icons[ext] || 'fas fa-file';
        }
    }
    
    // Глобальная функция для показа сообщений
    function showMessage(message, type = 'info') {
        const systemMessages = document.getElementById('systemMessages');
        if (!systemMessages) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        systemMessages.appendChild(alert);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
    
    // Запуск приложения при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        new QRGenerator();
    });
    
    // Делаем функции доступными глобально (для отладки)
    window.QRGeneratorApp = {
        showMessage: showMessage
    };
    
})();
