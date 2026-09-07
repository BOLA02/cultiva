// index.js
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Backend is running smoothly!');
});

app.listen(PORT, () => {
    console.log(`Server is live on http://localhost:${PORT}`);
});
