const express = require('express');
const app = express();

app.use(express.json());

// Kullanıcı listesi
let users = []; // { profileId, accessToken, culture }

// ✔ Şifreyi sen elle değiştireceksin
// Orijinal şifre (Base64'e çevrilmiş)
const PASSWORD_BASE64 = "OHhLOWJMMm1aN3FXNHZUNXJZMXVFM2lPNm5CMGhKOWFTMmRGNWdIODhqSzNtTjZiVjFjWA==";

// Base64 → normal şifre
const DASHBOARD_PASSWORD = Buffer.from(PASSWORD_BASE64, "base64").toString("utf8");

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

// --- GET /userlist ---
app.get('/userlist', (req, res) => {
  const password = req.query.p;

  // Şifre yok → Form göster
  if (!password) {
    return res.send(`
      <html>
        <body style="font-family:Arial; padding:20px;">
          <h2>Yetkili Paneli</h2>
          <form method="GET">
            <label>Şifre:</label><br>
            <input name="p" type="password" style="padding:8px; width:250px;">
            <br><br>
            <button type="submit" style="padding:8px 15px;">Giriş</button>
          </form>
        </body>
      </html>
    `);
  }

  // Şifre yanlış
  if (password !== DASHBOARD_PASSWORD) {
    return res.status(401).send("❌ Şifre yanlış");
  }

  // Şifre doğru → JSON döndür
  return res.json({
    total: users.length,
    accounts: users
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API çalışıyor → Port: ${port}`);
});
