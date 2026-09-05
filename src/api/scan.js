import express from 'express';
import { validateScanRequest } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

let scannerGlobal = null;

export function setScanner(scanner) {
  scannerGlobal = scanner;
}

// POST /api/scan
router.post('/', async (req, res) => {
  try {
    const validation = validateScanRequest(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const result = await scannerGlobal.scan(req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
