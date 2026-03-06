const generateBtn = document.getElementById('generateBtn');
const downloadQRBtn = document.getElementById('downloadQRBtn');
const infoBtn = document.getElementById('infoBtn');
const qrcodeContainer = document.getElementById('qrcode');

const textInput = document.getElementById('textInput');
const fileInput = document.getElementById('fileInput');
const chooseFileBtn = document.getElementById('chooseFileBtn');
const logoUpload = document.getElementById('logoUpload');

const dataTypeSelect = document.getElementById('dataType');

const startCameraBtn = document.getElementById('startCameraBtn');
const uploadImage = document.getElementById('uploadImage');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const decodedResult = document.getElementById('decodedResult');

let currentQRCode = null;
let qrCodeInstance = null;

// Обработка выбора файла
chooseFileBtn.addEventListener('click', () => {
    fileInput.click();
});
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            // Вставляем base64 содержимое файла
            textInput.value = reader.result;
        };
        reader.readAsDataURL(file);
    }
});

// Создание QR-кода
generateBtn.addEventListener('click', () => {
    // Очистка предыдущего QR
    qrcodeContainer.innerHTML = '';

    const type = dataTypeSelect.value;

    if (type === 'text') {
        const data = textInput.value;
        createQRCode(data);
    } else if (type === 'file' || type === 'archive' || type === 'folder' || type === 'presentation') {
        if (fileInput.files.length === 0) {
            alert('Пожалуйста, выберите файл.');
            return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const base64Data = reader.result; // base64 содержимое
            createQRCode(base64Data);
        };
        reader.readAsDataURL(file);
    }
});

// Функция создания QR
function createQRCode(data, logoDataUrl = null) {
    // Удаляем предыдущий QR
    qrcodeContainer.innerHTML = '';

    // Создаем новый QRCode
    qrCodeInstance = new QRCode(qrcodeContainer, {
        text: data,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H,
    });

    // Вставляем логотип, если есть
    if (logoDataUrl) {
        const qrCanvas = qrcodeContainer.querySelector('canvas');
        if (qrCanvas) {
            const ctx = qrCanvas.getContext('2d');
            const logoImg = new Image();
            logoImg.onload = () => {
                const size = 50;
                ctx.drawImage(logoImg, (qrCanvas.width - size) / 2, (qrCanvas.height - size) / 2, size, size);
            };
            logoImg.src = logoDataUrl;
        }
    }
}

// Скачать QR
downloadQRBtn.addEventListener('click', () => {
    const qrCanvas = qrcodeContainer.querySelector('canvas');
    if (qrCanvas) {
        const link = document.createElement('a');
        link.href = qrCanvas.toDataURL('image/png');
        link.download = 'qrcode.png';
        link.click();
    } else {
        alert('Создайте QR-код перед скачиванием.');
    }
});

// Информация о QR
infoBtn.addEventListener('click', () => {
    alert('Данный QR-код создан для передачи данных. Модель и тип зависят от содержимого.');
});

// Декодер с камерой
let videoStream = null;
startCameraBtn.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            videoStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            scanQRCode();
        })
        .catch(err => {
            alert('Не удалось получить доступ к камере: ' + err);
        });
});

function scanQRCode() {
    const ctx = canvas.getContext('2d');
    const scan = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                decodedResult.innerText = 'Расшифрованный текст: ' + code.data;
                // Остановить видеопоток
                if (videoStream) {
                    videoStream.getTracks().forEach(track => track.stop());
                }
                video.style.display = 'none';
                return;
            } else {
                requestAnimationFrame(scan);
            }
        } else {
            requestAnimationFrame(scan);
        }
    };
    scan();
}

// Обработка загрузки файла QR-кода
uploadImage.addEventListener('change', () => {
    const file = uploadImage.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                decodedResult.innerText = 'Расшифрованный текст: ' + code.data;
            } else {
                decodedResult.innerText = 'QR-код не найден или поврежден.';
            }
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});
