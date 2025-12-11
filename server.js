const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS (bookmarklet için)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Dosya yolu (Render’da kalıcı disk)
const DATA_FILE = path.join(__dirname, 'users-data.json');
let users = []; // { profileId, accessToken, culture, timestamp }

// Veriyi dosyadan yükle (her başlatmada)
function loadUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(data);
      console.log(`${users.length} hesap yüklendi`);
    }
  } catch (e) {
    console.log('Veri dosyası yok veya bozuk, sıfırdan başlıyoruz');
    users = [];
  }
}

// Veriyi dosyaya kaydet
function saveUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.log('Kaydetme hatası:', e.message);
  }
}

// 3 saatten eski hesapları temizle
function cleanExpired() {
  const now = Date.now();
  const beforeCount = users.length;
  users = users.filter(u => now - u.timestamp < 3 * 60 * 60 * 1000); // 3 saat
  if (users.length !== beforeCount) {
    console.log(`${beforeCount - users.length} eski hesap silindi`);
    saveUsers();
  }
}

// Başlangıçta yükle + her 10 dakikada bir temizle
loadUsers();
setInterval(cleanExpired, 10 * 60 * 1000); // 10 dakikada bir çöp topla
cleanExpired(); // ilk başlatmada da temizle

// POST /adduser
app.post('/adduser', (req, res) => {
  const { profileId, accessToken, culture = '' } = req.body;

  if (!profileId || !accessToken) {
    return res.status(400).json({ success: false, message: 'profileId ve accessToken zorunlu' });
  }

  const existingIndex = users.findIndex(u => u.profileId === profileId);

  const newUser = {
    profileId,
    accessToken,
    culture,
    timestamp: Date.now() // eklenme zamanı
  };

  if (existingIndex !== -1) {
    users[existingIndex] = newUser;
    console.log(`Güncellendi → ${profileId}`);
  } else {
    users.push(newUser);
    console.log(`Yeni hesap → ${profileId}`);
  }

  saveUsers(); // her eklemede kaydet
  res.json({ success: true, total: users.length });
});

// GET /userlist (sadece geçerli olanlar döner)
app.get('/userlist', (req, res) => {
  cleanExpired(); // isteğe gelince de temizle
  res.json({
    total: users.length,
    accounts: users.map(u => ({
      profileId: u.profileId,
      accessToken: u.accessToken,
      culture: u.culture,
      addedAt: new Date(u.timestamp).toISOString()
    }))
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API çalışıyor → https://api-login-ltur.onrender.com`);
  console.log(`Toplam aktif hesap: ${users.length}`);
});
