const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Define a Mongoose schema and model for uploaded files
const ImageSchema = new mongoose.Schema({
  fileUrl: String,
  category: String,
  description: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', ImageSchema);

// Define a Mongoose schema and model for users
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the "uploads" folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Add a unique suffix to the file name
  },
});

const upload = multer({ storage });

// API endpoint for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const { category, description } = req.body;

  try {
    // Save metadata to MongoDB
    const image = new Image({
      fileUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`,
      category,
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
    // Example: Fetch unique categories from the database
    const categories = await Image.distinct('category');
    res.json(categories);
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

    const filePath = path.join(__dirname, 'uploads', path.basename(image.fileUrl));

    // Delete the file from the file system
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});