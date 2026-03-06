// Максимальный размер данных в одной QR-коде (символов)
const MAX_QR_DATA_SIZE = 3000; 

// Массив для хранения частей при декодировании
let receivedParts = [];
let totalParts = 0;

// Функция для разбиения данных на части
function splitData(data) {
  const parts = [];
  for (let i = 0; i < data.length; i += MAX_QR_DATA_SIZE) {
    parts.push(data.substring(i, i + MAX_QR_DATA_SIZE));
  }
  return parts;
}

// Функция для генерации QR-кода (предположим, у вас есть existing generateQRCode)
function generateQRCode(data) {
  // Это должна быть ваша существующая функция или вызов библиотеки
  // Например, если используете qrcode.js:
  const qrContainer = document.getElementById('qrcode'); // или любой контейнер
  qrContainer.innerHTML = '';
  new QRCode(qrContainer, {
    text: data,
    width: 256,
    height: 256
  });
}

// Отображение серии QR-кодов для файла
function encodeFile(file) {
  const reader = new FileReader();
  reader.onload = function() {
    const arrayBuffer = reader.result;
    const bytes = new Uint8Array(arrayBuffer);
    // Конвертация в строку Base64
    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }
    const base64String = btoa(binaryStr);
    const parts = splitData(base64String);
    // Генерируем QR-коды для каждой части
    // Можно показывать их по очереди или по одной
    // Для примера — показываем последовательно по кнопке
    displayQRCodeSeries(parts);
  };
  reader.readAsArrayBuffer(file);
}

// Отображение серии QR-кодов
let qrSeries = [];
let currentQRIndex = 0;

function displayQRCodeSeries(parts) {
  qrSeries = parts;
  currentQRIndex = 0;
  showNextQRCode();
}

function showNextQRCode() {
  if (currentQRIndex >= qrSeries.length) {
    alert('Все QR-коды показаны. Можно сканировать их для восстановления файла.');
    return;
  }
  const qrData = JSON.stringify({
    part: currentQRIndex + 1,
    total: qrSeries.length,
    data: qrSeries[currentQRIndex]
  });
  generateQRCode(qrData);
  currentQRIndex++;
}

// Обработка сканирования QR-кода
// В вашем сайте должна быть функция, вызываемая при сканировании
// Например, добавим функцию handleScannedQR(qrText)

function handleScannedQR(qrText) {
  try {
    const obj = JSON.parse(qrText);
    if (obj.part && obj.total && obj.data) {
      // Инициализация при первой части
      if (obj.part === 1) {
        receivedParts = [];
        totalParts = obj.total;
      }
      receivedParts[obj.part - 1] = obj.data;

      // Проверяем, все ли части получены
      if (receivedParts.filter(Boolean).length === totalParts) {
        // Собираем файл
        const fullBase64 = receivedParts.join('');
        const binaryStr = atob(fullBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        // Создаем Blob и кнопку скачивания
        const blob = new Blob([bytes], { type: "application/octet-stream" });
        createDownloadButton(blob);
        // Очистка
        receivedParts = [];
        totalParts = 0;
      }
    }
  } catch (e) {
    console.error('Ошибка при обработке QR-кода:', e);
  }
}

// Создает кнопку для скачивания файла
function createDownloadButton(blob) {
  const btnContainer = document.getElementById('downloadBtnContainer');
  btnContainer.innerHTML = '';

  const url = URL.createObjectURL(blob);
  const btn = document.createElement('a');
  btn.href = url;
  btn.download = 'file';
  btn.textContent = 'Скачать файл из QR';
  btn.className = 'download-btn';

  btnContainer.appendChild(btn);
}

// Обработка выбора файла для кодирования
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    encodeFile(file);
  }
});

// Обработка кнопки "Показать следующий QR-код" (если делаете так)
document.getElementById('nextQRBtn')?.addEventListener('click', showNextQRCode);

// Вызовите эту функцию при необходимости очистки
function reset() {
  document.getElementById('qrcode').innerHTML = '';
  document.getElementById('downloadBtnContainer').innerHTML = '';
  receivedParts = [];
  totalParts = 0;
}

// Ваша существующая логика для сканирования QR-кодов должна вызывать handleScannedQR(qrText)
// Например, при успешном сканировании QR-кода вызываете эту функцию

// --- Конец файла ---
