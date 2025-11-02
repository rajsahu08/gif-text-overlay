const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'GIF Text Overlay API is running!' });
});
// Main API endpoint
// Main API endpoint
app.post('/overlay-text', upload.single('gif'), async (req, res) => {
    try {
        // Get parameters from request
        const { text, fontSize, x, y, angle, color } = req.body;
        const gifFile = req.file;

        // Validate inputs
        if (!gifFile) {
            return res.status(400).json({ error: 'No GIF file uploaded' });
        }
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        console.log('Processing GIF with text:', text);
        console.log('Parameters:', { fontSize, x, y, angle, color });

        // Upload the GIF to Cloudinary first
        const uploadResult = await cloudinary.uploader.upload(gifFile.path, {
            resource_type: 'image',
            format: 'gif'
        });

        // Get the public_id from the upload
        const publicId = uploadResult.public_id;

        // Create URL with text overlay using Cloudinary transformations
        const overlayUrl = cloudinary.url(publicId, {
            resource_type: 'image',
            transformation: [
                {
                    overlay: {
                        font_family: 'Arial',
                        font_size: fontSize || 30,
                        text: text
                    },
                    color: color || 'white',
                    gravity: 'north_west',
                    x: x || 50,
                    y: y || 50,
                    angle: angle || 0
                }
            ],
            format: 'gif'
        });
        fs.unlink(gifFile.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
        // Return the URL with text overlay
        res.json({
            success: true,
            message: 'GIF processed with text overlay',
            url: overlayUrl,
            originalUrl: uploadResult.secure_url,
            parameters: { text, fontSize, x, y, angle, color }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process GIF', details: error.message });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});