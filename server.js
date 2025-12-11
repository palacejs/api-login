const express = require('express');
const app = express();

// CORS'u tamamen aç (bookmarklet'ler origin=null olduğu için "*" ve credentials false şart)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');        // ya da sadece test için '*'
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight (OPTIONS) isteğini hemen 200 ile cevapla
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' })); // büyük token gelirse patlamasın

// Kullanıcı listesi (RAM’de tutuluyor, Render sleep atınca sıfırlanır, idare eder)
let users = [];

// --- POST /adduser ---
app.post('/adduser', (req, res) => {
  const { profileId, accessToken, culture = '' } = req.body;

  if (!profileId || !accessToken) {
    return res.status(400).json({ success: false, message: 'profileId ve accessToken zorunlu' });
  }

  const existingIndex = users.findIndex(u => u.profileId === profileId);

  if (existingIndex !== -1) {
    users[existingIndex] = { profileId, accessToken, culture };
    console.log(`Güncellendi → ${profileId}`);
  } else {
    users.push({ profileId, accessToken, culture });
    console.log(`Yeni hesap → ${profileId}`);
  }

  res.json({ success: true, total: users.length });
});

// --- GET /userlist (şifresiz direkt json) ---
app.get('/userlist', (req, res) => {
  res.json({
    total: users.length,
    accounts: users.map(u => ({
      profileId: u.profileId,
      accessToken: u.accessToken,
      culture: u.culture
    }))
  });
});

// Render’ın verdiği portu kullan
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API aktif → https://api-login-ltur.onrender.com (Port: ${port})`);
});
