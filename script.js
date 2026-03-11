let currentLogo = null;
let html5QrCode = null;

document.addEventListener('DOMContentLoaded', () => {
    // Переключение полей ввода
    document.getElementById('qr-type').onchange = (e) => {
        const type = e.target.value;
        ['text', 'url', 'wifi', 'vcard'].forEach(id => {
            document.getElementById(id + '-input').style.display = id === type ? 'block' : 'none';
        });
    };

    // Кнопки
    document.getElementById('generate-btn').onclick = generateQR;
    document.getElementById('info-btn').onclick = () => document.getElementById('info-modal').style.display = 'flex';
    document.querySelector('.close').onclick = () => document.getElementById('info-modal').style.display = 'none';
    
    // Удалить логотип
    document.getElementById('remove-logo').onclick = () => {
        currentLogo = null;
        document.getElementById('logo-upload').value = '';
        generateQR();
    };

    // Логотип
    document.getElementById('logo-upload').onchange = (e) => {
        if (!e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => { currentLogo = img; generateQR(); };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    // Камера
    document.getElementById('start-camera').onclick = () => {
        html5QrCode = new Html5Qrcode("camera-container");
        html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 200 },
            (text) => document.getElementById('result-content').innerHTML = text,
            () => {});
    };

    document.getElementById('stop-camera').onclick = () => {
        if (html5QrCode) html5QrCode.stop().then(() => html5QrCode.clear());
    };

    // Загрузка файла для декодинга
    document.getElementById('qr-file').onchange = (e) => {
        if (!e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                const code = jsQR(
                    canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data,
                    canvas.width, canvas.height
                );
                document.getElementById('result-content').innerHTML = code ? code.data : 'QR код не найден';
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    };

    generateQR();
});

function generateQR() {
    const type = document.getElementById('qr-type').value;
    let data = '';

    if (type === 'text') data = document.getElementById('text-content').value || 'Текст';
    else if (type === 'url') data = document.getElementById('url-content').value || 'https://example.com';
    else if (type === 'wifi') {
        const ssid = document.getElementById('wifi-ssid').value || 'WiFi';
        const pwd = document.getElementById('wifi-password').value || '';
        const enc = document.getElementById('wifi-encryption').value;
        data = `WIFI:S:${ssid};T:${enc};P:${pwd};;`;
    }
    else if (type === 'vcard') {
        const name = document.getElementById('vcard-name').value || 'Иван Иванов';
        const phone = document.getElementById('vcard-phone').value || '+79991234567';
        const email = document.getElementById('vcard-email').value || 'ivan@mail.com';
        data = `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
    }

    const qr = qrcode(0, 'H');
    qr.addData(data);
    qr.make();

    const canvas = document.getElementById('qr-canvas');
    const size = 250;
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const moduleSize = size / qr.getModuleCount();

    for (let row = 0; row < qr.getModuleCount(); row++) {
        for (let col = 0; col < qr.getModuleCount(); col++) {
            ctx.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
            ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
    }

    if (currentLogo) {
        const logoSize = size * 0.2;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
        ctx.drawImage(currentLogo, logoX, logoY, logoSize, logoSize);
    }
}

window.onclick = (e) => {
    if (e.target == document.getElementById('info-modal')) 
        document.getElementById('info-modal').style.display = 'none';
};
