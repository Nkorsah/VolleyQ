const express = require('express');
const router = express.Router();

// Placeholder for queue system
router.get('/match/queue', (req, res) => {
    res.status(200).json({ message: 'Queue system coming soon' });
});

module.exports = router;