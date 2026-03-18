const express = require('express');
const router = express.Router();

router.get('/stats', (req, res) => {
    res.status(200).json({ message: 'Stats service under development' });
});

module.exports = router;