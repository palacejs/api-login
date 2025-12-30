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

// Dosya yolları
const DATA_FILE = path.join(__dirname, 'users-data.json');
const ACCOUNTS_FILE = path.join(__dirname, 'accounts-data.json');

let users = []; // { profileId, accessToken, culture, timestamp }
let accounts = []; // { username, password, culture, profileId, accessToken, timestamp }

// Veriyi dosyadan yükle (her başlatmada)
function loadUsers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(data);
      console.log(`${users.length} user hesabı yüklendi`);
    }
  } catch (e) {
    console.log('User veri dosyası yok veya bozuk, sıfırdan başlıyoruz');
    users = [];
  }
}

function loadAccounts() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      accounts = JSON.parse(data);
      console.log(`${accounts.length} account hesabı yüklendi`);
    }
  } catch (e) {
    console.log('Account veri dosyası yok veya bozuk, sıfırdan başlıyoruz');
    accounts = [];
  }
}

// Veriyi dosyaya kaydet
function saveUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.log('User kaydetme hatası:', e.message);
  }
}

function saveAccounts() {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  } catch (e) {
    console.log('Account kaydetme hatası:', e.message);
  }
}

// 3 saatten eski hesapları temizle
function cleanExpired() {
  const now = Date.now();
  const beforeUserCount = users.length;
  const beforeAccountCount = accounts.length;
  
  users = users.filter(u => now - u.timestamp < 3 * 60 * 60 * 1000); // 3 saat
  accounts = accounts.filter(a => now - a.timestamp < 3 * 60 * 60 * 1000); // 3 saat
  
  if (users.length !== beforeUserCount) {
    console.log(`${beforeUserCount - users.length} eski user hesabı silindi`);
    saveUsers();
  }
  
  if (accounts.length !== beforeAccountCount) {
    console.log(`${beforeAccountCount - accounts.length} eski account hesabı silindi`);
    saveAccounts();
  }
}

// Başlangıçta yükle + her 10 dakikada bir temizle
loadUsers();
loadAccounts();
setInterval(cleanExpired, 10 * 60 * 1000); // 10 dakikada bir çöp topla
cleanExpired(); // ilk başlatmada da temizle

// POST /adduser (WebSocket kullanıcıları için)
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
    timestamp: Date.now()
  };

  if (existingIndex !== -1) {
    users[existingIndex] = newUser;
    console.log(`User güncellendi → ${profileId}`);
  } else {
    users.push(newUser);
    console.log(`Yeni user → ${profileId}`);
  }

  saveUsers();
  res.json({ success: true, total: users.length });
});

// POST /account (Hesap bilgilerini kaydet)
app.post('/account', (req, res) => {
  const { username, password, culture, profileId, accessToken } = req.body;

  if (!username || !password || !profileId || !accessToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'username, password, profileId ve accessToken zorunlu' 
    });
  }

  const existingIndex = accounts.findIndex(a => a.username === username);

  const newAccount = {
    username,
    password,
    culture: culture || 'TR',
    profileId,
    accessToken,
    timestamp: Date.now()
  };

  if (existingIndex !== -1) {
    accounts[existingIndex] = newAccount;
    console.log(`Account güncellendi → ${username}`);
  } else {
    accounts.push(newAccount);
    console.log(`Yeni account → ${username}`);
  }

  saveAccounts();
  res.json({ success: true, total: accounts.length });
});

// POST /login (Account login için)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'username ve password zorunlu' 
    });
  }

  // Süresi dolmuş hesapları temizle
  cleanExpired();

  // Kullanıcıyı bul
  const account = accounts.find(a => a.username === username && a.password === password);

  if (!account) {
    return res.status(401).json({ 
      success: false, 
      message: 'Kullanıcı adı veya şifre hatalı' 
    });
  }

  // Başarılı giriş
  console.log(`Başarılı giriş → ${username}`);
  res.json({ 
    success: true, 
    profileId: account.profileId,
    accessToken: account.accessToken,
    culture: account.culture 
  });
});

// GET /userlist (WebSocket kullanıcıları - sadece geçerli olanlar döner)
app.get('/userlist', (req, res) => {
  cleanExpired();
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

// GET /accounts (Kaydedilmiş hesaplar listesi)
app.get('/accounts', (req, res) => {
  cleanExpired();
  res.json({
    total: accounts.length,
    accounts: accounts.map(a => ({
      username: a.username,
      password: a.password,
      culture: a.culture,
      profileId: a.profileId,
      addedAt: new Date(a.timestamp).toISOString()
    }))
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API çalışıyor → https://api-login-ltur.onrender.com`);
  console.log(`Toplam aktif user: ${users.length}`);
  console.log(`Toplam aktif account: ${accounts.length}`);
});
