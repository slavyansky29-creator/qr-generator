const generateBtn = document.getElementById('generateBtn');
const dataInput = document.getElementById('dataInput');
const qrCanvas = document.getElementById('qrCanvas');
const infoBtn = document.getElementById('infoBtn');
const qrInfoDiv = document.getElementById('qrInfo');

const selectFileBtn = document.getElementById('selectFileBtn');
const fileInput = document.getElementById('fileInput');

const logoInput = document.getElementById('logoInput');

const startCameraBtn = document.getElementById('startCameraBtn');
const video = document.getElementById('video');
const videoCanvas = document.getElementById('videoCanvas');
const decodedResultDiv = document.getElementById('decodedResult');

const decodeFileInput = document.getElementById('decodeFileInput');

// Вместо хранения объекта Image будем хранить только DataURL логотипа
let currentLogoSrc = null;

// Загрузка файла для кодирования
selectFileBtn.onclick = () => {
    fileInput.click();
};

fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            dataInput.value = reader.result;
        };
        reader.readAsDataURL(file);
    }
};

// Загрузка логотипа – сохраняем DataURL
logoInput.onchange = () => {
    const file = logoInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            currentLogoSrc = reader.result;
        };
        reader.readAsDataURL(file);
    }
};

// Генерация QR-кода
generateBtn.onclick = () => {
    const data = dataInput.value.trim();
    if (!data) {
        alert('Пожалуйста, введите данные или выберите файл.');
        return;
    }

    // Очистить предыдущий QR-код
    const ctx = qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

    // Создать QR-код
    QRCode.toCanvas(qrCanvas, data, { width: 300 }, (error) => {
        if (error) {
            alert('Ошибка генерации QR-кода: ' + error.message);
            console.error(error);
            return;
        }

        // Если есть логотип, вставляем его после полной загрузки изображения
        if (currentLogoSrc) {
            const logo = new Image();
            logo.onload = () => {
                const size = 60; // размер логотипа
                ctx.drawImage(logo, (qrCanvas.width - size) / 2, (qrCanvas.height - size) / 2, size, size);
            };
            logo.onerror = () => {
                console.warn('Не удалось загрузить логотип');
            };
            logo.src = currentLogoSrc;
        }
    });
};

// Получить информацию о QR-коде
infoBtn.onclick = () => {
    const preview = dataInput.value.substring(0, 50);
    qrInfoDiv.innerHTML = `<p>Это QR-код, созданный для данных: ${preview}...</p>`;
};

// Декодирование через камеру
let decoding = false;
startCameraBtn.onclick = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            video.srcObject = stream;
            video.style.display = 'block';
            video.play();
            decoding = true;
            scanQRCode();
        })
        .catch(err => {
            alert('Не удалось получить доступ к камере: ' + err);
        });
};

function scanQRCode() {
    if (!decoding) return;
    const ctx = videoCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
    const imageData = ctx.getImageData(0, 0, videoCanvas.width, videoCanvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
        decoding = false;
        video.srcObject.getTracks().forEach(track => track.stop());
        video.style.display = 'none';
        decodedResultDiv.innerText = 'Результат: ' + code.data;
    } else {
        setTimeout(scanQRCode, 500);
    }
}

// Обработка файла для декодирования
decodeFileInput.onchange = () => {
    const file = decodeFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const ctx = document.createElement('canvas').getContext('2d');
                ctx.canvas.width = img.width;
                ctx.canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    decodedResultDiv.innerText = 'Результат: ' + code.data;
                } else {
                    decodedResultDiv.innerText = 'QR-код не найден или не распознан.';
                }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
};
