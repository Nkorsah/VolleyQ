const express = require('express');
const router = express.Router();

// Add New User
router.post('/player', (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Invalid username/password' });
    }

    try {
        // TODO: Save to Firebase
        res.status(200).json({ message: 'New user created' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get Users
router.get('/player', (req, res) => {
    const { name } = req.query;

    try {
        // TODO: Fetch from Firebase
        res.status(200).json({ message: 'List of users', filter: name || null });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update User
router.put('/player/:userId', (req, res) => {
    const { userId } = req.params;

    try {
        // TODO: Update Firebase
        res.status(200).json({ message: `User ${userId} updated` });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;