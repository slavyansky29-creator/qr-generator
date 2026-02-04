document.addEventListener('DOMContentLoaded', function() {
    console.log('QR Generator загружается...');
    
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
    let logoImage = null;
    
    // --- ЭЛЕМЕНТЫ DOM ---
    const elements = {
        // Основные элементы
        errorContainer: document.getElementById('errorContainer'),
        errorMessage: document.getElementById('errorMessage'),
        
        // Типы контента
        contentTypeRadios: document.querySelectorAll('input[name="contentType"]'),
        
        // Формы
        forms: document.querySelectorAll('.content-form'),
        urlInput: document.getElementById('urlInput'),
        textInput: document.getElementById('textInput'),
        testUrlBtn: document.getElementById('testUrlBtn'),
        urlStatus: document.getElementById('urlStatus'),
        
        // Файлы
        dropzoneArea: document.getElementById('dropzoneArea'),
        filePreview: document.getElementById('filePreview'),
        imageUpload: document.getElementById('imageUpload'),
        videoUpload: document.getElementById('videoUpload'),
        mediaPreview: document.getElementById('mediaPreview'),
        imageUploadBox: document.getElementById('imageUploadBox'),
        videoUploadBox: document.getElementById('videoUploadBox'),
        
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
    
    // --- ПРОВЕРКА БИБЛИОТЕК ---
    function checkLibraries() {
        const errors = [];
        
        if (typeof QRCode === 'undefined') {
            errors.push('Библиотека QRCode не загружена. Проверьте подключение к интернету.');
        }
        
        if (typeof Html5Qrcode === 'undefined') {
            errors.push('Библиотека Html5Qrcode не загружена. Проверьте подключение к интернету.');
        }
        
        if (typeof bootstrap === 'undefined') {
            errors.push('Библиотека Bootstrap не загружена. Проверьте подключение к интернету.');
        }
        
        if (errors.length > 0) {
            showError(errors.join(' '));
            return false;
        }
        
        return true;
    }
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function initApp() {
        console.log('Инициализация приложения...');
        
        // Проверяем библиотеки
        if (!checkLibraries()) {
            showError('Не удалось загрузить необходимые библиотеки. Проверьте подключение к интернету.');
            return;
        }
        
        setupEventListeners();
        loadFromLocalStorage();
        updateSizeDisplay();
        setupFileUpload();
        
        // Заполняем демо-данные
        elements.urlInput.value = 'https://github.com';
        elements.textInput.value = 'Добро пожаловать в мир QR-кодов!';
        
        // Генерируем демо QR-код
        setTimeout(() => {
            console.log('Запуск демо-генерации QR-кода...');
            generateQRCode().catch(err => {
                console.error('Ошибка демо-генерации:', err);
                showError('Ошибка при демо-генерации: ' + getErrorMessage(err));
            });
        }, 1000);
    }
    
    // --- ОБРАБОТЧИКИ ОШИБОК ---
    function getErrorMessage(error) {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('network') || message.includes('internet') || message.includes('failed to fetch')) {
                return 'Отсутствует подключение к интернету. Проверьте сетевое соединение.';
            } else if (message.includes('permission') || message.includes('access')) {
                return 'Отсутствуют необходимые разрешения.';
            } else if (message.includes('timeout') || message.includes('time out')) {
                return 'Превышено время ожидания. Попробуйте еще раз.';
            } else if (message.includes('invalid') || message.includes('not valid')) {
                return 'Некорректные данные для генерации QR-кода.';
            } else if (message.includes('size') || message.includes('too large')) {
                return 'Слишком большой размер данных для QR-кода.';
            } else if (message.includes('logo') || message.includes('image')) {
                return 'Ошибка при обработке логотипа. Убедитесь, что файл корректен.';
            }
            
            return error.message;
        }
        
        return String(error);
    }
    
    function showError(message) {
        console.error('Ошибка:', message);
        
        elements.errorMessage.textContent = message;
        elements.errorContainer.style.display = 'block';
        
        // Автоматически скрываем через 10 секунд
        setTimeout(() => {
            elements.errorContainer.style.display = 'none';
        }, 10000);
    }
    
    function hideError() {
        elements.errorContainer.style.display = 'none';
    }
    
    // --- НАСТРОЙКА СОБЫТИЙ ---
    function setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // Переключение типа контента
        elements.contentTypeRadios.forEach(radio => {
            radio.addEventListener('change', switchContentType);
        });
        
        // Обновление размера
        elements.qrSize.addEventListener('input', updateSizeDisplay);
        
        // Цвета
        elements.qrColor.addEventListener('change', function() {
            currentQR.color = this.value;
        });
        
        elements.bgColor.addEventListener('change', function() {
            currentQR.bgColor = this.value;
        });
        
        // Проверка URL
        elements.testUrlBtn?.addEventListener('click', testUrl);
        
        // Логотип
        elements.logoUpload.addEventListener('change', handleLogoUpload);
        elements.removeLogoBtn.addEventListener('click', removeLogo);
        elements.logoPreview.addEventListener('click', () => {
            elements.logoUpload.click();
        });
        
        // Генерация
        elements.generateBtn.addEventListener('click', () => {
            generateQRCode().catch(err => {
                showError('Ошибка при генерации QR-кода: ' + getErrorMessage(err));
            });
        });
        
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
        elements.startScanner?.addEventListener('click', startScanner);
        elements.stopScanner?.addEventListener('click', stopScanner);
        elements.downloadScannedFile?.addEventListener('click', downloadScannedFile);
        
        // Загрузка медиа файлов - ИСПРАВЛЕНИЕ ЗДЕСЬ!
        elements.imageUpload.addEventListener('change', handleMediaUpload);
        elements.videoUpload.addEventListener('change', handleMediaUpload);
        
        // Клик по областям загрузки медиа
        if (elements.imageUploadBox) {
            elements.imageUploadBox.addEventListener('click', () => {
                console.log('Клик по области загрузки фото');
                elements.imageUpload.click();
            });
        }
        
        if (elements.videoUploadBox) {
            elements.videoUploadBox.addEventListener('click', () => {
                console.log('Клик по области загрузки видео');
                elements.videoUpload.click();
            });
        }
        
        // Проверка онлайн статуса
        window.addEventListener('online', () => {
            console.log('Интернет соединение восстановлено');
            hideError();
        });
        
        window.addEventListener('offline', () => {
            showError('Отсутствует подключение к интернету. Проверьте сетевое соединение.');
        });
    }
    
    // --- ФУНКЦИИ ПРИЛОЖЕНИЯ ---
    
    function switchContentType(e) {
        const type = e.target.value;
        console.log('Переключение на тип:', type);
        currentQR.type = type;
        
        // Скрываем все формы
        elements.forms.forEach(form => {
            form.style.display = 'none';
        });
        
        // Показываем нужную форму
        const activeForm = document.getElementById(`${type}Form`);
        if (activeForm) {
            activeForm.style.display = 'block';
        }
    }
    
    function updateSizeDisplay() {
        const size = elements.qrSize.value;
        elements.sizeValue.textContent = size;
        currentQR.size = parseInt(size);
    }
    
    function testUrl() {
        const url = elements.urlInput.value.trim();
        if (!url) {
            elements.urlStatus.innerHTML = '<span class="text-danger"><i class="fas fa-times"></i> URL не введен</span>';
            return;
        }
        
        try {
            new URL(url);
            elements.urlStatus.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Корректный URL</span>';
        } catch (error) {
            elements.urlStatus.innerHTML = '<span class="text-danger"><i class="fas fa-times"></i> Некорректный URL</span>';
        }
    }
    
    function setupFileUpload() {
        console.log('Настройка загрузки файлов...');
        
        // Настройка drag & drop для файлов
        if (elements.dropzoneArea) {
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
    }
    
    function handleFileUpload(files) {
        console.log('Загрузка файлов:', files.length);
        
        if (files.length > 10) {
            showError('Максимум 10 файлов');
            return;
        }
        
        currentQR.files = Array.from(files);
        elements.filePreview.innerHTML = '';
        
        currentQR.files.forEach((file, index) => {
            if (file.size > 50 * 1024 * 1024) {
                showError(`Файл ${file.name} слишком большой (макс. 50MB)`);
                return;
            }
            
            // Создаем превью
            const preview = document.createElement('div');
            preview.className = 'file-preview-item fade-in';
            preview.dataset.index = index;
            
            const icon = getFileIcon(file.name);
            const size = formatFileSize(file.size);
            
            preview.innerHTML = `
                <i class="${icon} fa-lg"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${size}</div>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-file" type="button">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.filePreview.appendChild(preview);
            
            // Добавляем обработчик удаления
            preview.querySelector('.remove-file').addEventListener('click', () => {
                currentQR.files.splice(index, 1);
                preview.remove();
                showNotification('Файл удален', 'info');
            });
        });
        
        showNotification(`Загружено ${files.length} файлов`, 'success');
    }
    
    function handleMediaUpload(e) {
        console.log('Загрузка медиа:', e.target.id);
        
        const files = Array.from(e.target.files);
        const isImage = e.target.id === 'imageUpload';
        
        if (files.length === 0) return;
        
        // Очищаем превью для текущего типа
        if (isImage) {
            currentQR.mediaFiles = currentQR.mediaFiles.filter(f => !f.type.startsWith('image/'));
        } else {
            currentQR.mediaFiles = currentQR.mediaFiles.filter(f => !f.type.startsWith('video/'));
        }
        
        // Добавляем новые файлы
        files.forEach(file => {
            if (isImage && !file.type.startsWith('image/')) {
                showError('Пожалуйста, загружайте только изображения');
                return;
            }
            if (!isImage && !file.type.startsWith('video/')) {
                showError('Пожалуйста, загружайте только видео');
                return;
            }
            
            currentQR.mediaFiles.push(file);
        });
        
        // Обновляем превью
        updateMediaPreview();
        
        showNotification(`Загружено ${files.length} ${isImage ? 'изображений' : 'видео'}`, 'success');
    }
    
    function updateMediaPreview() {
        elements.mediaPreview.innerHTML = '';
        
        currentQR.mediaFiles.forEach((file, index) => {
            const isImage = file.type.startsWith('image/');
            const col = document.createElement('div');
            col.className = 'col-md-6 mb-3 fade-in';
            col.dataset.index = index;
            
            col.innerHTML = `
                <div class="media-preview-item">
                    <div class="media-thumbnail">
                        ${isImage ? 
                            `<img src="${URL.createObjectURL(file)}" alt="${file.name}" style="max-width: 100px; max-height: 100px;">` :
                            `<i class="fas fa-film fa-3x"></i>`
                        }
                    </div>
                    <div class="media-info mt-2">
                        <small class="d-block">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</small>
                        <small class="text-muted">${formatFileSize(file.size)}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger mt-2 remove-media" type="button">
                        <i class="fas fa-times"></i> Удалить
                    </button>
                </div>
            `;
            
            elements.mediaPreview.appendChild(col);
            
            // Добавляем обработчик удаления
            col.querySelector('.remove-media').addEventListener('click', () => {
                currentQR.mediaFiles.splice(index, 1);
                col.remove();
                showNotification('Медиафайл удален', 'info');
            });
        });
    }
    
    function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showError('Пожалуйста, выберите файл изображения');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            logoImage = new Image();
            logoImage.onload = function() {
                currentQR.logo = logoImage;
                elements.logoPreview.innerHTML = `<img src="${event.target.result}" alt="Логотип" style="width: 100%; height: 100%; object-fit: contain; border-radius: 10px;">`;
                showNotification('Логотип загружен успешно!', 'success');
                generateQRCode().catch(err => {
                    showError('Ошибка при генерации с логотипом: ' + getErrorMessage(err));
                });
            };
            logoImage.onerror = function() {
                showError('Ошибка при загрузке изображения логотипа');
            };
            logoImage.src = event.target.result;
        };
        reader.onerror = function() {
            showError('Ошибка при чтении файла логотипа');
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
        generateQRCode().catch(err => {
            showError('Ошибка при генерации без логотипа: ' + getErrorMessage(err));
        });
    }
    
    async function generateQRCode() {
        console.log('Начало генерации QR-кода...');
        
        // Скрываем старые ошибки
        hideError();
        
        // Получаем данные
        const data = getDataForQRType();
        console.log('Данные для QR-кода:', data);
        
        // Валидация данных
        if (!data || data.trim() === '') {
            throw new Error('Нет данных для генерации QR-кода. Пожалуйста, введите текст или выберите файлы.');
        }
        
        if (data.length > 2953) { // Ограничение для QR-кода
            throw new Error('Слишком много данных для QR-кода. Максимум 2953 символа.');
        }
        
        currentQR.data = data;
        
        // Показываем статус
        const originalText = elements.generateBtn.innerHTML;
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        
        try {
            console.log('Генерация изображения QR-кода...');
            await generateQRCodeImage();
            
            // Обновляем информацию
            updateQRInfo();
            
            // Показываем секцию скачивания
            elements.downloadSection.style.display = 'block';
            elements.noQrMessage.style.display = 'none';
            
            showNotification('QR-код успешно сгенерирован!', 'success');
        } catch (error) {
            console.error('Ошибка генерации:', error);
            throw error;
        } finally {
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = originalText;
        }
    }
    
    function getDataForQRType() {
        const type = document.querySelector('input[name="contentType"]:checked').value;
        console.log('Получение данных для типа:', type);
        
        switch(type) {
            case 'url':
                const url = elements.urlInput.value.trim();
                if (!url) {
                    throw new Error('Введите URL адрес');
                }
                try {
                    new URL(url); // Проверяем валидность URL
                } catch {
                    throw new Error('Некорректный URL адрес');
                }
                return url;
                
            case 'text':
                const text = elements.textInput.value.trim();
                if (!text) {
                    throw new Error('Введите текст для QR-кода');
                }
                return text;
                
            case 'files':
                if (currentQR.files.length === 0) {
                    throw new Error('Загрузите хотя бы один файл');
                }
                const fileNames = currentQR.files.map(f => f.name).join(', ');
                return `Файлы (${currentQR.files.length}): ${fileNames}`;
                
            case 'media':
                if (currentQR.mediaFiles.length === 0) {
                    throw new Error('Загрузите хотя бы одно фото или видео');
                }
                const mediaNames = currentQR.mediaFiles.map(f => f.name).join(', ');
                return `Медиа (${currentQR.mediaFiles.length}): ${mediaNames}`;
                
            default:
                throw new Error('Неизвестный тип контента');
        }
    }
    
    function generateQRCodeImage() {
        return new Promise((resolve, reject) => {
            try {
                // Очищаем контейнер
                elements.qrPreview.innerHTML = '';
                
                const size = currentQR.size;
                const fgColor = currentQR.color;
                const bgColor = currentQR.bgColor;
                
                console.log('Параметры генерации:', { size, fgColor, bgColor, dataLength: currentQR.data.length });
                
                // Создаем canvas для QR-кода
                QRCode.toCanvas(
                    currentQR.data,
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
                            console.error('Ошибка QRCode.toCanvas:', err);
                            reject(new Error('Ошибка библиотеки QRCode: ' + err.message));
                            return;
                        }
                        
                        try {
                            // Добавляем логотип если есть
                            if (currentQR.logo) {
                                addLogoToCanvas(canvas);
                            }
                            
                            canvas.id = 'qrCanvas';
                            canvas.style.display = 'block';
                            canvas.style.maxWidth = '100%';
                            canvas.style.height = 'auto';
                            
                            elements.qrPreview.appendChild(canvas);
                            resolve();
                        } catch (logoError) {
                            console.error('Ошибка при добавлении логотипа:', logoError);
                            // Продолжаем без логотипа
                            canvas.id = 'qrCanvas';
                            canvas.style.display = 'block';
                            canvas.style.maxWidth = '100%';
                            canvas.style.height = 'auto';
                            elements.qrPreview.appendChild(canvas);
                            resolve();
                        }
                    }
                );
            } catch (error) {
                console.error('Критическая ошибка генерации:', error);
                reject(new Error('Критическая ошибка при генерации: ' + error.message));
            }
        });
    }
    
    function addLogoToCanvas(canvas) {
        if (!currentQR.logo || !(currentQR.logo instanceof HTMLImageElement)) {
            throw new Error('Логотип не загружен или поврежден');
        }
        
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
        const borderSize = logoSize * 0.1;
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
                contentInfo = elements.urlInput.value.substring(0, 30);
                if (elements.urlInput.value.length > 30) contentInfo += '...';
                break;
            case 'text':
                contentInfo = elements.textInput.value.substring(0, 30);
                if (elements.textInput.value.length > 30) contentInfo += '...';
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
            showError('Сначала сгенерируйте QR-код');
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
                    downloadSVG();
                    return;
                default:
                    mimeType = 'image/png';
                    extension = 'png';
            }
            
            const dataUrl = canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : 1.0);
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.${extension}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification(`QR-код скачан в формате ${format.toUpperCase()}!`, 'success');
        } catch (error) {
            showError('Ошибка при скачивании: ' + getErrorMessage(error));
        }
    }
    
    function downloadSVG() {
        try {
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) throw new Error('QR-код не сгенерирован');
            
            const dataUrl = canvas.toDataURL('image/png');
            const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${currentQR.size}" height="${currentQR.size}">
                <image href="${dataUrl}" width="100%" height="100%"/>
            </svg>`;
            
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.svg`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('QR-код скачан в формате SVG!', 'success');
        } catch (error) {
            showError('Ошибка при скачивании SVG: ' + getErrorMessage(error));
        }
    }
    
    function copyShareUrl() {
        if (!elements.qrShareUrl.value) {
            showError('Сначала сгенерируйте QR-код');
            return;
        }
        
        try {
            elements.qrShareUrl.select();
            elements.qrShareUrl.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(elements.qrShareUrl.value)
                .then(() => {
                    showNotification('Ссылка скопирована в буфер обмена!', 'success');
                })
                .catch(() => {
                    // Fallback для старых браузеров
                    document.execCommand('copy');
                    showNotification('Ссылка скопирована!', 'success');
                });
        } catch (err) {
            showError('Не удалось скопировать ссылку: ' + getErrorMessage(err));
        }
    }
    
    function saveToLibrary() {
        try {
            const canvas = document.getElementById('qrCanvas');
            if (!canvas) {
                throw new Error('Сначала сгенерируйте QR-код');
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
        } catch (error) {
            showError('Ошибка при сохранении в библиотеку: ' + getErrorMessage(error));
        }
    }
    
    function updateLibraryDisplay() {
        try {
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
                        <img src="${item.image}" alt="QR-код" class="img-fluid mb-2" style="width: 100px; height: 100px; object-fit: contain;">
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
                    useQRFromLibrary(parseInt(this.dataset.index));
                });
            });
        } catch (error) {
            console.error('Ошибка при отображении библиотеки:', error);
        }
    }
    
    function useQRFromLibrary(index) {
        try {
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
                updateSizeDisplay();
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
                generateQRCode().catch(err => {
                    showError('Ошибка при загрузке из библиотеки: ' + getErrorMessage(err));
                });
                
                showNotification('QR-код загружен из библиотеки!', 'success');
            }
        } catch (error) {
            showError('Ошибка при загрузке из библиотеки: ' + getErrorMessage(error));
        }
    }
    
    function loadFromLocalStorage() {
        try {
            updateLibraryDisplay();
        } catch (error) {
            console.error('Ошибка при загрузке из localStorage:', error);
        }
    }
    
    function startScanner() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Ваш браузер не поддерживает доступ к камере');
            return;
        }
        
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
                console.log('Ошибка сканирования:', errorMessage);
            }
        ).then(() => {
            elements.startScanner.style.display = 'none';
            elements.stopScanner.style.display = 'inline-block';
        }).catch(err => {
            console.error('Не удалось запустить камеру:', err);
            showError('Не удалось получить доступ к камере. Проверьте разрешения.');
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
            '7z': 'fas fa-file-archive',
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
        // Удаляем старые уведомления
        document.querySelectorAll('.custom-notification').forEach(el => el.remove());
        
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
        notification.className = `alert ${alertClass} alert-dismissible fade show custom-notification position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
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
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Добавляем CSS анимацию
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // --- ЗАПУСК ПРИЛОЖЕНИЯ ---
    console.log('Приложение инициализируется...');
    initApp();
});
