import express from 'express';
const router = express.Router();

router.get('/stats', (req, res) => {
    res.status(200).json({ message: 'Stats service under development' });
});

export default router;