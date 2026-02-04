document.addEventListener('DOMContentLoaded', function() {
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    let currentQR = {
        data: '',
        type: 'url',
        logo: null,
        color: '#000000',
        bgColor: '#FFFFFF',
        size: 400,
        files: [],
        mediaFiles: []
    };
    
    let html5QrCode = null;
    let logoImage = new Image();
    let uploadToken = null;
    
    // --- ЭЛЕМЕНТЫ DOM ---
    const elements = {
        // Типы контента
        contentTypeRadios: document.querySelectorAll('input[name="contentType"]'),
        
        // Формы
        forms: document.querySelectorAll('.content-form'),
        urlInput: document.getElementById('urlInput'),
        textInput: document.getElementById('textInput'),
        
        // Файлы
        dropzoneArea: document.getElementById('dropzoneArea'),
        filePreview: document.getElementById('filePreview'),
        imageUpload: document.getElementById('imageUpload'),
        videoUpload: document.getElementById('videoUpload'),
        mediaPreview: document.getElementById('mediaPreview'),
        
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
        qrSVG: document.getElementById('qrSVG'),
        noQrMessage: document.getElementById('noQrMessage'),
        
        // Информация
        qrInfo: document.getElementById('qrInfo'),
        qrTypeInfo: document.getElementById('qrTypeInfo'),
        qrSizeInfo: document.getElementById('qrSizeInfo'),
        qrContentInfo: document.getElementById('qrContentInfo'),
        
        // Скачивание
        downloadSection: document.getElementById('downloadSection'),
        downloadBtns: document.querySelectorAll('.download-btn'),
        qrShareUrl: document.getElementById('qrShareUrl'),
        copyShareUrl: document.getElementById('copyShareUrl'),
        saveToLibrary: document.getElementById('saveToLibrary'),
        
        // Сканер
        startScanner: document.getElementById('startScanner'),
        stopScanner: document.getElementById('stopScanner'),
        scannerContainer: document.getElementById('scannerContainer'),
        scanResult: document.getElementById('scanResult'),
        resultContent: document.getElementById('resultContent'),
        fileDownloadSection: document.getElementById('fileDownloadSection'),
        downloadScannedFile: document.getElementById('downloadScannedFile'),
        
        // Библиотека
        qrLibrary: document.getElementById('qrLibrary')
    };
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    initApp();
    
    function initApp() {
        setupEventListeners();
        loadFromLocalStorage();
        updateSizeDisplay();
        setupFileUpload();
        
        // Генерируем демо QR-код
        setTimeout(generateQRCode, 1000);
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
        
        // Копирование ссылки
        elements.copyShareUrl.addEventListener('click', copyShareUrl);
        
        // Сохранение в библиотеку
        elements.saveToLibrary.addEventListener('click', saveToLibrary);
        
        // Сканер
        elements.startScanner.addEventListener('click', startScanner);
        elements.stopScanner.addEventListener('click', stopScanner);
        elements.downloadScannedFile.addEventListener('click', downloadScannedFile);
        
        // Загрузка файлов
        elements.imageUpload.addEventListener('change', handleMediaUpload);
        elements.videoUpload.addEventListener('change', handleMediaUpload);
    }
    
    // --- ФУНКЦИИ ПРИЛОЖЕНИЯ ---
    
    function switchContentType(e) {
        const type = e.target.value;
        currentQR.type = type;
        
        // Скрываем все формы
        elements.forms.forEach(form => form.style.display = 'none');
        
        // Показываем нужную форму
        document.getElementById(`${type}Form`).style.display = 'block';
        
        // Очищаем превью при переключении
        if (type !== 'files') {
            elements.filePreview.innerHTML = '';
            currentQR.files = [];
        }
        if (type !== 'media') {
            elements.mediaPreview.innerHTML = '';
            currentQR.mediaFiles = [];
        }
    }
    
    function updateSizeDisplay() {
        const size = elements.qrSize.value;
        elements.sizeValue.textContent = size;
        currentQR.size = parseInt(size);
    }
    
    function setupFileUpload() {
        // Настройка drag & drop
        elements.dropzoneArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            this.style.background = 'rgba(52, 152, 219, 0.1)';
        });
        
        elements.dropzoneArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            this.style.background = 'rgba(52, 152, 219, 0.05)';
        });
        
        elements.dropzoneArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3498db';
            this.style.background = 'rgba(52, 219, 152, 0.05)';
            handleFileUpload(e.dataTransfer.files);
        });
        
        elements.dropzoneArea.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '*/*';
            input.onchange = function(e) {
                handleFileUpload(e.target.files);
            };
            input.click();
        });
    }
    
    async function handleFileUpload(files) {
        if (files.length > 10) {
            alert('Максимум 10 файлов');
            return;
        }
        
        currentQR.files = [];
        elements.filePreview.innerHTML = '';
        
        for (let file of files) {
            if (file.size > 50 * 1024 * 1024) { // 50MB
                alert(`Файл ${file.name} слишком большой (макс. 50MB)`);
                continue;
            }
            
            currentQR.files.push(file);
            
            // Создаем превью
            const preview = document.createElement('div');
            preview.className = 'file-preview-item fade-in';
            
            const icon = getFileIcon(file.name);
            const size = formatFileSize(file.size);
            
            preview.innerHTML = `
                <i class="${icon} fa-lg"></i>
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
    }
    
    function handleMediaUpload(e) {
        const files = Array.from(e.target.files);
        const isImage = e.target.id === 'imageUpload';
        
        files.forEach(file => {
            if (isImage && !file.type.startsWith('image/')) {
                alert('Пожалуйста, загружайте только изображения');
                return;
            }
            if (!isImage && !file.type.startsWith('video/')) {
                alert('Пожалуйста, загружайте только видео');
                return;
            }
            
            currentQR.mediaFiles.push(file);
            
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-3';
            
            col.innerHTML = `
                <div class="media-preview-item">
                    <div class="media-thumbnail">
                        ${isImage ? 
                            `<img src="${URL.createObjectURL(file)}" alt="${file.name}">` :
                            `<i class="fas fa-film fa-3x"></i>`
                        }
                    </div>
                    <div class="media-info">
                        <small>${file.name}</small>
                        <small class="text-muted">${formatFileSize(file.size)}</small>
                    </div>
                </div>
            `;
            
            elements.mediaPreview.appendChild(col);
        });
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
                showNotification('Логотип загружен успешно!', 'success');
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
        showNotification('Логотип удален', 'info');
        generateQRCode();
    }
    
    async function generateQRCode() {
        const data = getDataForQRType();
        if (!data) {
            showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
            return;
        }
        
        currentQR.data = data;
        
        // Показываем статус
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        
        try {
            await generateQRCodeImage(data);
            await generateQRCodeSVG(data);
            
            // Обновляем информацию
            updateQRInfo();
            
            // Показываем секцию скачивания
            elements.downloadSection.style.display = 'block';
            elements.noQrMessage.style.display = 'none';
            
            showNotification('QR-код успешно сгенерирован!', 'success');
        } catch (error) {
            console.error('Ошибка генерации:', error);
            showNotification('Ошибка при генерации QR-кода', 'error');
        } finally {
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Сгенерировать QR-код';
        }
    }
    
    function getDataForQRType() {
        const type = document.querySelector('input[name="contentType"]:checked').value;
        
        switch(type) {
            case 'url':
                return elements.urlInput.value || 'https://github.com';
                
            case 'text':
                return elements.textInput.value || 'Добро пожаловать в мир QR-кодов!';
                
            case 'files':
                // Для файлов создаем специальный URL
                if (currentQR.files.length === 0) {
                    return null;
                }
                // В реальном приложении здесь был бы серверный endpoint
                return `files:${currentQR.files.length}_files_uploaded`;
                
            case 'media':
                if (currentQR.mediaFiles.length === 0) {
                    return null;
                }
                return `media:${currentQR.mediaFiles.length}_media_files`;
                
            default:
                return 'https://github.com';
        }
    }
    
    function generateQRCodeImage(data) {
        return new Promise((resolve, reject) => {
            // Очищаем контейнер
            elements.qrCanvas.style.display = 'none';
            elements.qrSVG.style.display = 'none';
            
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
                        reject(err);
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
                    
                    resolve();
                }
            );
        });
    }
    
    function addLogoToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const logoSize = size * 0.2; // 20% от размера QR-кода
        
        // Рассчитываем позицию для логотипа (центр)
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;
        
        // Сохраняем состояние контекста
        ctx.save();
        
        // Добавляем белую рамку
        ctx.fillStyle = '#ffffff';
        const borderSize = logoSize * 0.2;
        ctx.fillRect(
            x - borderSize/2,
            y - borderSize/2,
            logoSize + borderSize,
            logoSize + borderSize
        );
        
        // Рисуем логотип
        ctx.drawImage(currentQR.logo, x, y, logoSize, logoSize);
        
        // Восстанавливаем состояние
        ctx.restore();
    }
    
    function generateQRCodeSVG(data) {
        return new Promise((resolve) => {
            // В этой версии просто резолвим промис
            // В реальном приложении здесь была бы генерация SVG
            resolve();
        });
    }
    
    function updateQRInfo() {
        const type = document.querySelector('input[name="contentType"]:checked').value;
        const typeNames = {
            'url': 'URL',
            'text': 'Текст',
            'files': 'Файлы',
            'media': 'Медиа'
        };
        
        let contentInfo = '';
        switch(type) {
            case 'url':
                contentInfo = elements.urlInput.value.substring(0, 50);
                if (elements.urlInput.value.length > 50) contentInfo += '...';
                break;
            case 'text':
                contentInfo = elements.textInput.value.substring(0, 50);
                if (elements.textInput.value.length > 50) contentInfo += '...';
                break;
            case 'files':
                contentInfo = `Файлов: ${currentQR.files.length}`;
                break;
            case 'media':
                contentInfo = `Медиафайлов: ${currentQR.mediaFiles.length}`;
                break;
        }
        
        elements.qrTypeInfo.textContent = `Тип: ${typeNames[type]}`;
        elements.qrSizeInfo.textContent = `Размер: ${currentQR.size}px`;
        elements.qrContentInfo.textContent = `Содержимое: ${contentInfo}`;
        elements.qrInfo.style.display = 'block';
        
        // Обновляем ссылку для общего доступа
        const canvas = document.getElementById('qrCanvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            elements.qrShareUrl.value = dataUrl.substring(0, 100) + '...';
        }
    }
    
    function downloadQRCode(format) {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) {
            showNotification('Сначала сгенерируйте QR-код', 'warning');
            return;
        }
        
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
                // Для SVG нужна отдельная реализация
                showNotification('SVG скачивание временно недоступно', 'info');
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
        
        showNotification(`QR-код скачан в формате ${format.toUpperCase()}!`, 'success');
    }
    
    function copyShareUrl() {
        elements.qrShareUrl.select();
        elements.qrShareUrl.setSelectionRange(0, 99999);
        
        try {
            navigator.clipboard.writeText(elements.qrShareUrl.value);
            showNotification('Ссылка скопирована в буфер обмена!', 'success');
        } catch (err) {
            showNotification('Не удалось скопировать ссылку', 'error');
        }
    }
    
    function saveToLibrary() {
        const canvas = document.getElementById('qrCanvas');
        if (!canvas) {
            showNotification('Сначала сгенерируйте QR-код', 'warning');
            return;
        }
        
        // Сохраняем в localStorage
        const qrData = {
            data: currentQR.data,
            type: currentQR.type,
            size: currentQR.size,
            color: currentQR.color,
            bgColor: currentQR.bgColor,
            timestamp: new Date().toISOString(),
            image: canvas.toDataURL('image/png')
        };
        
        let library = JSON.parse(localStorage.getItem('qrLibrary') || '[]');
        library.unshift(qrData);
        
        // Ограничиваем количество сохраненных QR-кодов
        if (library.length > 20) {
            library = library.slice(0, 20);
        }
        
        localStorage.setItem('qrLibrary', JSON.stringify(library));
        updateLibraryDisplay();
        
        showNotification('QR-код сохранен в библиотеку!', 'success');
    }
    
    function updateLibraryDisplay() {
        const library = JSON.parse(localStorage.getItem('qrLibrary') || '[]');
        elements.qrLibrary.innerHTML = '';
        
        if (library.length === 0) {
            elements.qrLibrary.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Здесь будут сохраненные QR-коды</p>
                </div>
            `;
            return;
        }
        
        library.forEach((item, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-3';
            
            col.innerHTML = `
                <div class="qr-library-item">
                    <img src="${item.image}" alt="QR-код" class="img-fluid mb-2">
                    <p class="mb-1 small"><strong>${item.type}</strong></p>
                    <p class="mb-1 small text-muted">${new Date(item.timestamp).toLocaleDateString()}</p>
                    <button class="btn btn-sm btn-outline-primary w-100 use-qr-btn" data-index="${index}">
                        Использовать
                    </button>
                </div>
            `;
            
            elements.qrLibrary.appendChild(col);
        });
        
        // Добавляем обработчики для кнопок "Использовать"
        document.querySelectorAll('.use-qr-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                useQRFromLibrary(index);
            });
        });
    }
    
    function useQRFromLibrary(index) {
        const library = JSON.parse(localStorage.getItem('qrLibrary') || '[]');
        if (library[index]) {
            const item = library[index];
            
            // Устанавливаем значения из библиотеки
            currentQR.data = item.data;
            currentQR.type = item.type;
            currentQR.size = item.size;
            currentQR.color = item.color;
            currentQR.bgColor = item.bgColor;
            
            // Обновляем интерфейс
            elements.qrSize.value = item.size;
            elements.sizeValue.textContent = item.size;
            elements.qrColor.value = item.color;
            elements.bgColor.value = item.bgColor;
            
            // Выбираем правильный тип
            document.querySelector(`#type${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`).checked = true;
            switchContentType({ target: { value: item.type } });
            
            // Устанавливаем данные в форму
            if (item.type === 'url') {
                elements.urlInput.value = item.data;
            } else if (item.type === 'text') {
                elements.textInput.value = item.data;
            }
            
            // Генерируем QR-код
            generateQRCode();
            
            showNotification('QR-код загружен из библиотеки!', 'success');
        }
    }
    
    function loadFromLocalStorage() {
        updateLibraryDisplay();
    }
    
    function startScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            return;
        }
        
        html5QrCode = new Html5Qrcode("reader");
        
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            elements.resultContent.textContent = decodedText;
            elements.scanResult.style.display = 'block';
            
            // Проверяем, содержит ли QR-код ссылку на файл
            if (decodedText.startsWith('file:')) {
                elements.fileDownloadSection.style.display = 'block';
            } else {
                elements.fileDownloadSection.style.display = 'none';
            }
            
            stopScanner();
        };
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            (errorMessage) => {
                // Игнорируем ошибки, если сканирование не остановлено явно
            }
        ).then(() => {
            elements.startScanner.style.display = 'none';
            elements.stopScanner.style.display = 'inline-block';
        }).catch(err => {
            console.error('Не удалось запустить камеру:', err);
            showNotification('Не удалось получить доступ к камере', 'error');
        });
    }
    
    function stopScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                elements.startScanner.style.display = 'inline-block';
                elements.stopScanner.style.display = 'none';
            }).catch(err => {
                console.error('Ошибка при остановке камеры:', err);
            });
        }
    }
    
    function downloadScannedFile() {
        const content = elements.resultContent.textContent;
        showNotification('Функция скачивания файла из QR-кода в разработке', 'info');
    }
    
    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    
    function getFileIcon(filename) {
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
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint'
        };
        return icons[ext] || 'fas fa-file';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showNotification(message, type = 'info') {
        // Создаем уведомление
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        const icon = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notification.innerHTML = `
            <i class="fas ${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 150);
            }
        }, 5000);
    }
});