const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const data = new URLSearchParams({
    client_id: 'unity.client',
    client_secret: 'secret',
    grant_type: 'password',
    scope: 'openid nebula offline_access',
    username,
    password,
    acr_values: 'gameId:j68d deviceId:6463D7756BAF77AFDA8E44B052E788CCA4E4F8C06AEAB268D7A0ED2C7F9549D8'
  });

  try {
    const r = await axios.post(
      'https://eu-secure.mspapis.com/loginidentity/connect/token',
      data,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    res.json(r.data); // direkt access_token, refresh_token vs. döner
  } catch (e) {
    res.status(400).json({ error: e.response?.data || e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('MSP2 Proxy çalışıyor → port', port));
