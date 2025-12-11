const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// CORS aç
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Tek satırda her şey
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const payload = new URLSearchParams({
    client_id: 'unity.client',
    client_secret: 'secret',
    grant_type: 'password',
    scope: 'openid nebula offline_access',
    username: username,
    password: password,
    acr_values: 'gameId:j68d deviceId:6463D7756BAF77AFDA8E44B052E788CCA4E4F8C06AEAB268D7A0ED2C7F9549D8'
  });

  try {
    const response = await axios.post(
      'https://eu-secure.mspapis.com/loginidentity/connect/token',
      payload,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(400).json({ 
      error: "Login başarısız", 
      message: error.response?.data || error.message 
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('MSP2 Proxy aktif →', port));
