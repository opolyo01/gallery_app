const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel
app.set('trust proxy', 1); // Trust the first proxy (required for Vercel)

// Security middleware
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Enable CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:4200',
  'https://grand-eclair-97a639.netlify.app',
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow cookies and authorization headers
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Enable JSON body parsing
app.use(express.json());

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// MongoDB reconnection handling
mongoose.connection.on('disconnected', () => {
  console.error('MongoDB connection lost. Retrying...');
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Define Mongoose schemas and models
const ImageSchema = new mongoose.Schema({
  fileUrl: String,
  publicId: String, // Add this field to store the Cloudinary public_id
  category: String,
  description: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', ImageSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Add these to your .env file
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gallery_app', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed file formats
  },
});

const upload = multer({ storage });

// API endpoint for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
  const { category, description } = req.body;

  try {
    // Normalize the category to lowercase
    const normalizedCategory = category.toLowerCase();

    // Save metadata to MongoDB
    const image = new Image({
      fileUrl: req.file.path,
      publicId: req.file.filename,
      category: normalizedCategory,
      description,
    });

    await image.save();

    res.json({
      message: 'File uploaded successfully!',
      fileUrl: image.fileUrl,
      category: image.category,
      description: image.description,
    });
  } catch (err) {
    console.error('Error saving to MongoDB:', err);
    res.status(500).json({ message: 'Failed to save metadata to the database.' });
  }
});

// API endpoint to fetch all images
app.get('/images', async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: 'Failed to fetch images.' });
  }
});

// API endpoint to fetch categories
app.get('/categories', async (req, res) => {
  try {
    // Fetch distinct categories and normalize them to lowercase
    const categories = await Image.distinct('category');
    const uniqueCategories = [...new Set(categories.map((cat) => cat.toLowerCase()))];

    res.json(uniqueCategories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

// API endpoint to clean the database
app.delete('/clean-database', async (req, res) => {
  try {
    const images = await Image.find();

    for (const image of images) {
      const filePath = path.join(__dirname, 'uploads', path.basename(image.fileUrl));

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}. Deleting record from database.`);
        await Image.deleteOne({ _id: image._id });
      }
    }

    res.json({ message: 'Database cleanup complete.' });
  } catch (err) {
    console.error('Error cleaning database:', err);
    res.status(500).json({ message: 'Failed to clean database.' });
  }
});

// API endpoint to delete a file and its database record
app.delete('/delete-file/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found.' });
    }

    const result = await cloudinary.uploader.destroy(image.publicId);
    if (result.result !== 'ok') {
      console.error('Failed to delete file from Cloudinary:', result);
      return res.status(500).json({ message: 'Failed to delete file from Cloudinary.' });
    }

    // Delete the record from the database
    await Image.deleteOne({ _id: image._id });

    res.json({ message: 'File and database record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ message: 'Failed to delete file.' });
  }
});

// API endpoint for user signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Failed to register user.' });
  }
});

// API endpoint for user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Failed to login.' });
  }
});

// Middleware to authenticate requests
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Invalid token:', err.message);
      return res.status(403).json({ message: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Protect routes with the `authenticateToken` middleware
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route.', user: req.user });
});

// API endpoint for root
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for Vercel
module.exports = app;