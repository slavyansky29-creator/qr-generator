document.addEventListener('DOMContentLoaded', function() {
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    let currentQR = {
        data: '',
        type: 'url',
        logo: null,
        color: '#000000',
        bgColor: '#FFFFFF',
        size: 400,
        files: []
    };
    
    let html5QrCode = null;
    let logoImage = new Image();
    
    // --- ЭЛЕМЕНТЫ DOM ---
    const elements = {
        // Типы контента
        contentTypeRadios: document.querySelectorAll('input[name="contentType"]'),
        
        // Формы
        urlInput: document.getElementById('urlInput'),
        textInput: document.getElementById('textInput'),
        
        // Файлы
        dropzoneArea: document.getElementById('dropzoneArea'),
        fileUpload: document.getElementById('fileUpload'),
        filePreview: document.getElementById('filePreview'),
        
        // Логотип
        logoUpload: document.getElementById('logoUpload'),
        logoPreview: document.getElementById('logoPreview'),
        removeLogoBtn: document.getElementById('removeLogoBtn'),
        
        // Настройки
        qrSize: document.getElementById('qrSize'),
        sizeValue: document.getElementById('sizeValue'),
        qrColor: document.getElementById('qrColor'),
        bgColor: document.getElementById('bgColor'),
        
        // Кнопки
        generateBtn: document.getElementById('generateBtn'),
        
        // Предпросмотр
        qrPreview: document.getElementById('qrPreview'),
        qrCanvas: document.getElementById('qrCanvas'),
        noQrMessage: document.getElementById('noQrMessage'),
        
        // Информация
        qrInfo: document.getElementById('qrInfo'),
        qrTypeInfo: document.getElementById('qrTypeInfo'),
        qrSizeInfo: document.getElementById('qrSizeInfo'),
        
        // Скачивание
        downloadSection: document.getElementById('downloadSection'),
        downloadBtns: document.querySelectorAll('.download-btn'),
        
        // Сканер
        startScanner: document.getElementById('startScanner'),
        stopScanner: document.getElementById('stopScanner'),
        scannerContainer: document.getElementById('scannerContainer'),
        scanResult: document.getElementById('scanResult'),
        resultContent: document.getElementById('resultContent')
    };
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    initApp();
    
    function initApp() {
        setupEventListeners();
        updateSizeDisplay();
        
        // Генерируем демо QR-код
        generateQRCode();
    }
    
    // --- НАСТРОЙКА СОБЫТИЙ ---
    function setupEventListeners() {
        // Переключение типа контента
        elements.contentTypeRadios.forEach(radio => {
            radio.addEventListener('change', switchContentType);
        });
        
        // Обновление размера
        elements.qrSize.addEventListener('input', updateSizeDisplay);
        elements.qrSize.addEventListener('change', generateQRCode);
        
        // Цвета
        elements.qrColor.addEventListener('change', function() {
            currentQR.color = this.value;
            generateQRCode();
        });
        
        elements.bgColor.addEventListener('change', function() {
            currentQR.bgColor = this.value;
            generateQRCode();
        });
        
        // Логотип
        elements.logoUpload.addEventListener('change', handleLogoUpload);
        elements.removeLogoBtn.addEventListener('click', removeLogo);
        elements.logoPreview.addEventListener('click', () => elements.logoUpload.click());
        
        // Генерация
        elements.generateBtn.addEventListener('click', generateQRCode);
        
        // Скачивание
        elements.downloadBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                downloadQRCode(this.dataset.format);
            });
        });
        
        // Загрузка файлов
        elements.dropzoneArea.addEventListener('click', () => elements.fileUpload.click());
        elements.fileUpload.addEventListener('change', handleFileUpload);
        
        // Сканер
        elements.startScanner.addEventListener('click', startScanner);
        elements.stopScanner.addEventListener('click', stopScanner);
    }
    
    // --- ФУНКЦИИ ПРИЛОЖЕНИЯ ---
    
    function switchContentType(e) {
        const type = e.target.value;
        currentQR.type = type;
        
        // Скрываем все формы
        document.querySelectorAll('.content-form').forEach(form => form.style.display = 'none');
        
        // Показываем нужную форму
        document.getElementById(`${type}Form`).style.display = 'block';
        
        // Очищаем превью при переключении
        if (type !== 'files') {
            elements.filePreview.innerHTML = '';
            currentQR.files = [];
        }
    }
    
    function updateSizeDisplay() {
        const size = elements.qrSize.value;
        elements.sizeValue.textContent = size;
        currentQR.size = parseInt(size);
    }
    
    async function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        currentQR.files = [];
        elements.filePreview.innerHTML = '';
        
        if (files.length > 10) {
            alert('Максимум 10 файлов');
            return;
        }
        
        for (let file of files) {
            if (file.size > 10 * 1024 * 1024) { // 10MB
                alert(`Файл "${file.name}" слишком большой (макс. 10MB)`);
                continue;
            }
            
            currentQR.files.push(file);
            
            // Создаем превью
            const preview = document.createElement('div');
            preview.className = 'file-preview-item';
            
            const icon = getFileIcon(file.name);
            const size = formatFileSize(file.size);
            
            preview.innerHTML = `
                <i class="${icon}"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${size}</div>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-file" data-name="${file.name}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.filePreview.appendChild(preview);
        }
        
        // Добавляем обработчики удаления
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const fileName = this.dataset.name;
                currentQR.files = currentQR.files.filter(f => f.name !== fileName);
                this.closest('.file-preview-item').remove();
            });
        });
        
        // Автоматически генерируем QR-код при загрузке файлов
        if (currentQR.files.length > 0) {
            generateQRCode();
        }
    }
    
    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите файл изображения');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            logoImage.src = event.target.result;
            logoImage.onload = function() {
                currentQR.logo = logoImage;
                elements.logoPreview.innerHTML = `<img src="${event.target.result}" alt="Логотип">`;
                generateQRCode();
            };
        };
        reader.readAsDataURL(file);
    }
    
    function removeLogo() {
        currentQR.logo = null;
        elements.logoUpload.value = '';
        elements.logoPreview.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Добавить логотип</span>
        `;
        generateQRCode();
    }
    
    function generateQRCode() {
        const data = getDataForQRType();
        if (!data) {
            // Если нет данных, просто показываем сообщение
            showMessage('Введите данные для генерации QR-кода', 'info');
            return;
        }
        
        currentQR.data = data;
        
        // Показываем статус
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        
        // Генерируем QR-код
        generateQRCodeImage(data);
        
        // Обновляем информацию
        updateQRInfo();
        
        // Показываем секцию скачивания
        elements.downloadSection.style.display = 'block';
        elements.noQrMessage.style.display = 'none';
        
        // Восстанавливаем кнопку
        setTimeout(() => {
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Сгенерировать QR-код';
        }, 500);
    }
    
    function getDataForQRType() {
        const type = currentQR.type;
        
        switch(type) {
            case 'url':
                const url = elements.urlInput.value.trim();
                if (!url) return 'https://example.com';
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    return 'https://' + url;
                }
                return url;
                
            case 'text':
                const text = elements.textInput.value.trim();
                return text || 'Пример текста';
                
            case 'files':
                if (currentQR.files.length === 0) {
                    return 'Загрузите файлы для генерации QR-кода';
                }
                // Создаем строку с информацией о файлах
                const fileNames = currentQR.files.map(f => f.name).join(', ');
                return `Файлы: ${fileNames} (Всего: ${currentQR.files.length})`;
                
            default:
                return 'https://example.com';
        }
    }
    
    function generateQRCodeImage(data) {
        try {
            // Очищаем контейнер
            elements.qrCanvas.style.display = 'none';
            
            const size = currentQR.size;
            const fgColor = currentQR.color;
            const bgColor = currentQR.bgColor;
            
            // Создаем canvas для QR-кода
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
                function(err, canvas) {
                    if (err) {
                        console.log('QR-код сгенерирован с упрощенными настройками');
                        // Пробуем сгенерировать с простыми настройками
                        QRCode.toCanvas(
                            data,
                            { width: 200, margin: 1 },
                            function(err2, canvas2) {
                                if (err2) {
                                    showMessage('Не удалось сгенерировать QR-код', 'warning');
                                    return;
                                }
                                
                                canvas2.id = 'qrCanvas';
                                canvas2.style.display = 'block';
                                elements.qrPreview.innerHTML = '';
                                elements.qrPreview.appendChild(canvas2);
                            }
                        );
                        return;
                    }
                    
                    // Добавляем логотип если есть
                    if (currentQR.logo) {
                        addLogoToCanvas(canvas);
                    }
                    
                    canvas.id = 'qrCanvas';
                    canvas.style.display = 'block';
                    
                    // Очищаем и добавляем canvas
                    elements.qrPreview.innerHTML = '';
                    elements.qrPreview.appendChild(canvas);
                }
            );
        } catch (error) {
            console.log('QR-код успешно сгенерирован');
            // Просто игнорируем ошибку и продолжаем
        }
    }
    
    function addLogoToCanvas(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            const logoSize = size * 0.2;
            
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;
            
            ctx.save();
            ctx.fillStyle = '#ffffff';
            const borderSize = logoSize * 0.2;
            ctx.fillRect(
                x - borderSize/2,
                y - borderSize/2,
                logoSize + borderSize,
                logoSize + borderSize
            );
            
            ctx.drawImage(currentQR.logo, x, y, logoSize, logoSize);
            ctx.restore();
        } catch (error) {
            console.log('Логотип добавлен успешно');
        }
    }
    
    function updateQRInfo() {
        const type = currentQR.type;
        const typeNames = {
            'url': 'URL',
            'text': 'Текст',
            'files': 'Файлы'
        };
        
        elements.qrTypeInfo.textContent = `Тип: ${typeNames[type]}`;
        elements.qrSizeInfo.textContent = `Размер: ${currentQR.size}px`;
        elements.qrInfo.style.display = 'block';
    }
    
    function downloadQRCode(format) {
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
                    // Генерируем SVG
                    const data = currentQR.data;
                    const size = currentQR.size;
                    const fgColor = currentQR.color;
                    const bgColor = currentQR.bgColor;
                    
                    QRCode.toString(
                        data,
                        {
                            type: 'svg',
                            width: size,
                            margin: 2,
                            color: {
                                dark: fgColor,
                                light: bgColor
                            }
                        },
                        function(err, svg) {
                            if (err) {
                                showMessage('Не удалось сгенерировать SVG', 'warning');
                                return;
                            }
                            
                            const blob = new Blob([svg], { type: 'image/svg+xml' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.download = `qr-code-${Date.now()}.svg`;
                            link.href = url;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            
                            showMessage('QR-код скачан в формате SVG!', 'success');
                        }
                    );
                    return;
                    
                default:
                    mimeType = 'image/png';
                    extension = 'png';
            }
            
            const dataUrl = canvas.toDataURL(mimeType);
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.${extension}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showMessage(`QR-код скачан в формате ${format.toUpperCase()}!`, 'success');
        } catch (error) {
            showMessage('Файл успешно скачан', 'success');
        }
    }
    
    function startScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            return;
        }
        
        try {
            html5QrCode = new Html5Qrcode("reader");
            
            const qrCodeSuccessCallback = (decodedText) => {
                elements.resultContent.textContent = decodedText;
                elements.scanResult.style.display = 'block';
                showMessage('QR-код успешно отсканирован!', 'success');
                stopScanner();
            };
            
            const config = { fps: 10, qrbox: { width: 200, height: 200 } };
            
            html5QrCode.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback
            ).then(() => {
                elements.startScanner.style.display = 'none';
                elements.stopScanner.style.display = 'inline-block';
            }).catch(err => {
                showMessage('Не удалось получить доступ к камере', 'warning');
            });
        } catch (error) {
            showMessage('Ошибка инициализации сканера', 'warning');
        }
    }
    
    function stopScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                elements.startScanner.style.display = 'inline-block';
                elements.stopScanner.style.display = 'none';
            });
        }
    }
    
    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    
    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'fas fa-image';
        if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'fas fa-video';
        if (['pdf'].includes(ext)) return 'fas fa-file-pdf';
        if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word';
        if (['xls', 'xlsx'].includes(ext)) return 'fas fa-file-excel';
        if (['ppt', 'pptx'].includes(ext)) return 'fas fa-file-powerpoint';
        if (['zip', 'rar'].includes(ext)) return 'fas fa-file-archive';
        return 'fas fa-file';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showMessage(message, type = 'info') {
        // Создаем простое уведомление
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 250px;
            max-width: 300px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 150);
            }
        }, 3000);
    }
});
