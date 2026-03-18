const express = require('express');
const router = express.Router();

// Create New Team
router.post('/team', (req, res) => {
    const { name, players, color, privateLobby } = req.body;

    if (!name || !players || !color || privateLobby === undefined) {
        return res.status(400).json({ message: 'Invalid team object' });
    }

    try {
        // TODO: Save to Firebase
        res.status(200).json({ message: 'New team created' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete Team
router.delete('/team/:teamId', (req, res) => {
    const { teamId } = req.params;

    try {
        // TODO: Delete from Firebase
        res.status(200).json({ message: `Team ${teamId} deleted` });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update Team
router.put('/team/:teamId', (req, res) => {
    const { teamId } = req.params;

    try {
        // TODO: Update Firebase
        res.status(200).json({ message: `Team ${teamId} updated` });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;