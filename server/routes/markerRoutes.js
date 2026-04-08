import express from 'express';
import { db } from '../firebase.js';

const router = express.Router();
//we need auth here baaaaad
router.post('/create-marker', async (req, res) => {
  console.log('/api/create-marker called...');
  try {
    const { lat, lng, label } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'lat and lng are required numbers' });
    }
    if (!label || typeof label !== 'string') {
      return res.status(400).json({ message: 'label is required' });
    }

    const uid = '1234567';

    const markerRef = db.collection('markers').doc();
    const marker = {
      id: markerRef.id,
      lat,
      lng,
      label,
      createdBy: uid,
      createdAt: new Date().toISOString(),
    };

    await markerRef.set(marker);
    res.status(201).json(marker);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/markers', async (req, res) => {
  console.log('/api/markers called...');
  try {
    const snap = await db.collection('markers').get();
    const markers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(markers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/delete-marker/:markerId', async (req, res) => {
  const { markerId } = req.params;
  console.log(`/api/delete-marker/${markerId} called...`);
  try {
    // TODO: replace with real auth
    const uid = '1234567';

    const markerRef = db.collection('markers').doc(markerId);
    const markerSnap = await markerRef.get();

    if (!markerSnap.exists) {
      return res.status(404).json({ message: 'Marker not found' });
    }
    if (markerSnap.data().createdBy !== uid) {
      return res.status(403).json({ message: 'Only the creator can delete this marker' });
    }

    await markerRef.delete();
    res.status(200).json({ message: `Marker ${markerId} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;