const express = require('express');
const router = express.Router();

const { processCertificates } = require('../controllers/process.controllers');

router.post('/generate', async (req, res) => {
  try {
    const { eventId, cType = 0 | 1 } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    } else if (cType !== 0 && cType !== 1) {
      return res.status(400).json({ success: false, error: 'Invalid certificate type' });
    }

    const token = process.env.API_TOKEN;
    if (!token) {
      return res.status(500).json({ success: false, error: 'API token not configured' });
    }

    const result = await processCertificates(eventId, cType, token);

    res.json({
      success: true,
      message: `Successfully generated ${result.certificateCount} certificates`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate certificates'
    });
  }
});

module.exports = router;
