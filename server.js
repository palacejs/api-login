const express = require('express');
const app = express();

// CORS (bookmarklet için gerekli)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

app.use(express.json());

let users = []; // { profileId, accessToken, culture }

// Gizli API key (kendin değiştir, güçlü yap!)
const API_KEY = 'obfx2025gizlianahtar8xK9pL2mZ7qW4vT5rY1uE3iO6nB0hJ9'; // DEĞİŞTİR AQ!

// Middleware: Sadece /userlist için key kontrol
const requireApiKey = (req, res, next) => {
  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ success: false, message: 'Geçersiz API key' });
  }
  next();
};

// POST /adduser → Hesap ekle/güncelle
app.post('/adduser', (req, res) => {
  const { profileId, accessToken, culture = '' } = req.body;

  if (!profileId || !accessToken) {
    return res.status(400).json({ success: false, message: 'profileId ve accessToken zorunlu' });
  }

  const existingIndex = users.findIndex(u => u.profileId === profileId);
  if (existingIndex !== -1) {
    users[existingIndex] = { profileId, accessToken, culture };
    console.log(`Hesap güncellendi → ${profileId}`);
  } else {
    users.push({ profileId, accessToken, culture });
    console.log(`Yeni hesap eklendi → ${profileId}`);
  }

  res.json({ success: true, total: users.length });
});

// GET /userlist → Listeyi göster (sadece API key ile erişilir)
app.get('/userlist', requireApiKey, (req, res) => {
  if (users.length === 0) {
    return res.send('Toplam Hesap Sayısı: 0\n\nHenüz hesap eklenmedi.');
  }

  let output = `Toplam Hesap Sayısı: ${users.length}\n\n`;

  users.forEach(user => {
    output += `Profile ID: "${user.profileId}"\n`;
    output += `AccesToken: "${user.accessToken}"\n`;
    output += `Culture: "${user.culture}"\n\n`;
  });

  res.type('text').send(output.trim());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API çalışıyor → Port: ${port}`);
});
