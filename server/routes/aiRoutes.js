const express = require('express');
const router = express.Router();

router.get('/ai/commentary', (req, res) => {
    res.status(200).json({ message: 'AI commentary endpoint (to be implemented)' });
});

module.exports = router;