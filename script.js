// Глобальные переменные
let qrCode = nul;
let html5QrCode = null;
let currentLogo = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    generateQRCode(); // Генерируем тестовый QR
});

function initializeEventListeners() {
    // Переключение типов QR
    document.getElementById('qr-type').addEventListener('change', toggleInputFields);
    
    // Генерация QR
    document.getElementById('generate-btn').addEventListener('click', generateQRCode);
    
    // Загрузка логотипа
    document.getElementById('logo-upload').addEventListener('change', handleLogoUpload);
    
    // Информационная кнопка
    document.getElementById('info-btn').addEventListener('click', showInfoModal);
    
    // Закрытие модального окна
    document.querySelector('.close').addEventListener('click', hideInfoModal);
    
    // Камера
    document.getElementById('start-camera').addEventListener('click', startCamera);
    document.getElementById('stop-camera').addEventListener('click', stopCamera);
    
    // Загрузка файла
    document.getElementById('qr-file').addEventListener('change', decodeFromFile);
}

function toggleInputFields() {
    const type = document.getElementById('qr-type').value;
    
    // Скрываем все поля
    document.getElementById('text-input').style.display = 'none';
    document.getElementById('url-input').style.display = 'none';
    document.getElementById('wifi-input').style.display = 'none';
    document.getElementById('vcard-input').style.display = 'none';
    
    // Показываем нужные поля
    switch(type) {
        case 'text':
            document.getElementById('text-input').style.display = 'block';
            break;
        case 'url':
            document.getElementById('url-input').style.display = 'block';
            break;
        case 'wifi':
            document.getElementById('wifi-input').style.display = 'block';
            break;
        case 'vcard':
            document.getElementById('vcard-input').style.display = 'block';
            break;
    }
}

function generateQRCode() {
    const type = document.getElementById('qr-type').value;
    let data = '';
    
    // Формируем данные в зависимости от типа
    switch(type) {
        case 'text':
            data = document.getElementById('text-content').value || 'Пример текста';
            break;
        case 'url':
            data = document.getElementById('url-content').value || 'https://example.com';
            break;
        case 'wifi':
            const ssid = document.getElementById('wifi-ssid').value || 'MyWiFi';
            const password = document.getElementById('wifi-password').value || '';
            const encryption = document.getElementById('wifi-encryption').value;
            data = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
            break;
        case 'vcard':
            const name = document.getElementById('vcard-name').value || 'Иван Иванов';
            const phone = document.getElementById('vcard-phone').value || '+79991234567';
            const email = document.getElementById('vcard-email').value || 'ivan@example.com';
            const company = document.getElementById('vcard-company').value || 'Company';
            data = `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nORG:${company}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            break;
    }
    
    // Создаем QR код
    const qr = qrcode(0, 'H');
    qr.addData(data);
    qr.make();
    
    // Получаем canvas и рисуем QR
    const canvas = document.getElementById('qr-canvas');
    const size = Math.min(300, qr.getModuleCount() * 10);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    
    // Рисуем QR код
    const moduleSize = size / qr.getModuleCount();
    for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
            ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#ffffff';
            ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
    }
    
    // Добавляем логотип, если есть
    if (currentLogo) {
        const logoSize = size * 0.2; // Логотип занимает 20% от размера QR
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        
        // Белый фон для логотипа
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
        
        // Рисуем логотип
        ctx.drawImage(currentLogo, logoX, logoY, logoSize, logoSize);
    }
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                currentLogo = img;
                generateQRCode(); // Перегенерируем QR с логотипом
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function showInfoModal() {
    document.getElementById('info-modal').style.display = 'flex';
}

function hideInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

// Функции для работы с камерой
function startCamera() {
    html5QrCode = new Html5Qrcode("camera-container");
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
            // Успешное распознавание
            displayDecodedResult(decodedText);
        },
        (errorMessage) => {
            // Ошибка распознавания (игнорируем)
        }
    ).catch(err => {
        alert('Ошибка доступа к камере: ' + err);
    });
}

function stopCamera() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        });
    }
}

function decodeFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Создаем canvas для анализа изображения
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Получаем данные изображения
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Используем jsQR для распознавания
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            
            if (code) {
                displayDecodedResult(code.data);
            } else {
                displayDecodedResult('QR код не найден на изображении');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayDecodedResult(result) {
    document.getElementById('result-content').innerHTML = `
        <strong>Распознано:</strong><br>
        <pre>${result}</pre>
    `;
    
    // Определяем тип данных
    let type = 'Неизвестный тип';
    if (result.startsWith('WIFI:')) {
        type = 'Wi-Fi';
    } else if (result.startsWith('BEGIN:VCARD')) {
        type = 'vCard (Контакт)';
    } else if (result.startsWith('http://') || result.startsWith('https://')) {
        type = 'URL';
    } else {
        type = 'Текст';
    }
    
    // Добавляем информацию о типе
    document.getElementById('result-content').innerHTML += `
        <br><br>
        <strong>Тип данных:</strong> ${type}
    `;
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('info-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

