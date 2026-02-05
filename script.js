document.addEventListener('DOMContentLoaded', function() {
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    let currentData = '';
    let currentType = 'url';
    let logoImage = null;
    let currentFiles = [];
    let currentQRDataUrl = '';

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
        
        // Кнопки
        generateBtn: document.getElementById('generateBtn'),
        
        // Результат
        qrPreview: document.getElementById('qrPreview'),
        qrResult: document.getElementById('qrResult'),
        noQrMessage: document.getElementById('noQrMessage'),
        downloadSection: document.getElementById('downloadSection'),
        downloadBtns: document.querySelectorAll('.download-btn')
    };

    // --- ИНИЦИАЛИЗАЦИЯ ---
    initApp();

    function initApp() {
        setupEventListeners();
        
        // Сразу генерируем QR-код с демо-данными
        setTimeout(() => {
            generateQRCode();
        }, 500);
    }

    // --- НАСТРОЙКА СОБЫТИЙ ---
    function setupEventListeners() {
        // Переключение типа контента
        elements.contentTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                currentType = this.value;
                switchContentType(currentType);
            });
        });

        // Загрузка файлов
        elements.dropzoneArea.addEventListener('click', () => {
            elements.fileUpload.click();
        });
        
        elements.fileUpload.addEventListener('change', handleFileUpload);

        // Логотип
        elements.logoUpload.addEventListener('change', handleLogoUpload);
        elements.removeLogoBtn.addEventListener('click', removeLogo);
        elements.logoPreview.addEventListener('click', () => elements.logoUpload.click());

        // Генерация QR-кода
        elements.generateBtn.addEventListener('click', function() {
            generateQRCode();
        });

        // Скачивание QR-кода
        elements.downloadBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                downloadQRCode(this.dataset.format);
            });
        });
    }

    // --- ФУНКЦИИ ПРИЛОЖЕНИЯ ---
    
    function switchContentType(type) {
        // Скрываем все формы
        document.querySelectorAll('.content-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Показываем нужную форму
        document.getElementById(`${type}Form`).style.display = 'block';
        
        // Очищаем превью файлов если переключились с файлов
        if (type !== 'files') {
            elements.filePreview.innerHTML = '';
            currentFiles = [];
        }
    }

    function handleFileUpload(e) {
        const files = Array.from(e.target.files);
        currentFiles = files;
        elements.filePreview.innerHTML = '';
        
        files.forEach((file, index) => {
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
                <button class="btn btn-sm btn-outline-danger remove-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.filePreview.appendChild(preview);
        });
        
        // Добавляем обработчики удаления файлов
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                currentFiles.splice(index, 1);
                updateFilePreview();
            });
        });
    }

    function updateFilePreview() {
        elements.filePreview.innerHTML = '';
        currentFiles.forEach((file, index) => {
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
                <button class="btn btn-sm btn-outline-danger remove-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.filePreview.appendChild(preview);
        });
        
        // Повторно добавляем обработчики
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                currentFiles.splice(index, 1);
                updateFilePreview();
            });
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
            logoImage = new Image();
            logoImage.src = event.target.result;
            logoImage.onload = function() {
                elements.logoPreview.innerHTML = `<img src="${event.target.result}" alt="Логотип">`;
            };
        };
        reader.readAsDataURL(file);
    }

    function removeLogo() {
        logoImage = null;
        elements.logoUpload.value = '';
        elements.logoPreview.innerHTML = '<i class="fas fa-plus"></i>';
    }

    // ГЛАВНАЯ ФУНКЦИЯ: Генерация QR-кода
    function generateQRCode() {
        // Получаем данные в зависимости от типа
        let data = '';
        
        switch(currentType) {
            case 'url':
                data = elements.urlInput.value.trim();
                if (!data) {
                    data = 'https://example.com';
                } else if (!data.startsWith('http://') && !data.startsWith('https://')) {
                    data = 'https://' + data;
                }
                break;
                
            case 'text':
                data = elements.textInput.value.trim();
                if (!data) {
                    data = 'Пример текста для QR-кода';
                }
                break;
                
            case 'files':
                if (currentFiles.length === 0) {
                    data = 'Файлы не загружены';
                } else {
                    const fileNames = currentFiles.map(f => f.name).join(', ');
                    data = `Файлы (${currentFiles.length}): ${fileNames}`;
                }
                break;
        }
        
        currentData = data;
        
        // Показываем загрузку
        elements.generateBtn.disabled = true;
        elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        
        // Генерируем QR-код
        generateQRCodeImage(data, function(qrDataUrl) {
            if (qrDataUrl) {
                // Показываем результат
                elements.noQrMessage.style.display = 'none';
                elements.qrResult.style.display = 'block';
                elements.qrResult.innerHTML = `<img src="${qrDataUrl}" alt="QR Code" id="qrImage">`;
                currentQRDataUrl = qrDataUrl;
                
                // Показываем кнопки скачивания
                elements.downloadSection.style.display = 'block';
                
                // Успешное сообщение
                showMessage('QR-код успешно сгенерирован!', 'success');
            } else {
                showMessage('Не удалось сгенерировать QR-код', 'warning');
            }
            
            // Восстанавливаем кнопку
            elements.generateBtn.disabled = false;
            elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Сгенерировать QR-код';
        });
    }

    function generateQRCodeImage(data, callback) {
        try {
            // Создаем временный canvas для генерации QR-кода
            const canvas = document.createElement('canvas');
            const size = 300; // Фиксированный размер
            
            // Генерируем QR-код на canvas
            QRCode.toCanvas(
                canvas,
                data,
                {
                    width: size,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'H'
                },
                function(err) {
                    if (err) {
                        console.error('Ошибка генерации QR-кода:', err);
                        callback(null);
                        return;
                    }
                    
                    // Если есть логотип, добавляем его
                    if (logoImage) {
                        addLogoToCanvas(canvas, logoImage, size);
                    }
                    
                    // Преобразуем canvas в Data URL
                    const dataUrl = canvas.toDataURL('image/png');
                    callback(dataUrl);
                }
            );
        } catch (error) {
            console.error('Ошибка:', error);
            callback(null);
        }
    }

    function addLogoToCanvas(canvas, logo, qrSize) {
        try {
            const ctx = canvas.getContext('2d');
            const logoSize = qrSize * 0.2; // 20% от размера QR-кода
            
            // Рассчитываем позицию для логотипа (центр)
            const x = (qrSize - logoSize) / 2;
            const y = (qrSize - logoSize) / 2;
            
            // Сохраняем состояние контекста
            ctx.save();
            
            // Добавляем белую рамку вокруг логотипа
            ctx.fillStyle = '#ffffff';
            const borderSize = logoSize * 0.2;
            ctx.fillRect(
                x - borderSize/2,
                y - borderSize/2,
                logoSize + borderSize,
                logoSize + borderSize
            );
            
            // Рисуем логотип
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            
            // Восстанавливаем состояние
            ctx.restore();
        } catch (error) {
            console.log('Логотип не был добавлен:', error);
        }
    }

    function downloadQRCode(format) {
        if (!currentQRDataUrl) {
            showMessage('Сначала сгенерируйте QR-код', 'warning');
            return;
        }
        
        try {
            // Создаем временный image для конвертации
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Определяем формат и MIME type
                let mimeType, extension;
                if (format === 'jpeg') {
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                } else {
                    mimeType = 'image/png';
                    extension = 'png';
                }
                
                // Конвертируем и скачиваем
                const dataUrl = canvas.toDataURL(mimeType);
                const link = document.createElement('a');
                link.download = `qr-code-${Date.now()}.${extension}`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showMessage(`QR-код скачан в формате ${format.toUpperCase()}!`, 'success');
            };
            img.src = currentQRDataUrl;
        } catch (error) {
            showMessage('Ошибка при скачивании файла', 'danger');
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
        if (['txt'].includes(ext)) return 'fas fa-file-alt';
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
        // Удаляем старые сообщения
        const oldMessages = document.querySelectorAll('.alert-message');
        oldMessages.forEach(msg => msg.remove());
        
        // Создаем новое сообщение
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show alert-message position-fixed`;
        notification.style.cssText = `
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 250px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
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
