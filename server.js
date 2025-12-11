const express = require('express');
const app = express();

app.use(express.json());

// Kullanıcı listesi
let users = []; // { profileId, accessToken, culture }

// --- POST /adduser ---
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

// --- GET /userlist (ŞİFRESİZ, DİREKT JSON) ---
app.get('/userlist', (req, res) => {
  return res.json({
    total: users.length,
    accounts: users
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API çalışıyor → Port: ${port}`);
});
