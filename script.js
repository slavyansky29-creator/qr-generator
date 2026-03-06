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
            textInput.value = reader.result; // Для удобства, можно вставить как base64
        };
        reader.readAsDataURL(file);
    }
});

// Создание QR-кода
generateBtn.addEventListener('click', () => {
    // Очистка предыдущего QR
    qrcodeContainer.innerHTML = '';

    let data = '';
    const type = dataTypeSelect.value;

    if (type === 'text') {
        data = textInput.value;
    } else {
        // Для файлов и архивов, можно использовать base64
        data = textInput.value;
        if (!data) {
            alert('Пожалуйста, введите текст или выберите файл.');
            return;
        }
    }

    // Встроить логотип, если выбран
    const logoFile = logoUpload.files[0];
    if (logoFile) {
        const reader = new FileReader();
        reader.onload = () => {
            createQRCode(data, reader.result);
        };
        reader.readAsDataURL(logoFile);
    } else {
        createQRCode(data, null);
    }
});

// Функция создания QR
function createQRCode(data, logoDataUrl) {
    // Используем QRCode.js
    // Можно дополнительно вставить логотип в центр, создавая свой собственный элемент или вставляя в canvas
    qrCodeInstance = new QRCode(qrcodeContainer, {
        text: data,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.H,
    });

    if (logoDataUrl) {
        // Вставляем логотип в центр
        const qrElement = qrcodeContainer.querySelector('canvas');
        if (qrElement) {
            const ctx = qrElement.getContext('2d');
            const logoImg = new Image();
            logoImg.onload = () => {
                const size = 50; // Размер логотипа
                ctx.drawImage(logoImg, (qrElement.width - size) / 2, (qrElement.height - size) / 2, size, size);
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
