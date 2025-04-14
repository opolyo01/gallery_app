const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Define the Image schema and model
const ImageSchema = new mongoose.Schema({
  fileUrl: String,
  category: String,
  description: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Image = mongoose.model('Image', ImageSchema);

// Path to the uploads folder
const uploadsFolder = path.join(__dirname, 'uploads');

// Function to clean the database
async function cleanDatabase() {
  try {
    const images = await Image.find();

    for (const image of images) {
      const filePath = path.join(uploadsFolder, path.basename(image.fileUrl));

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}. Deleting record from database.`);
        await Image.deleteOne({ _id: image._id });
      }
    }

    console.log('Database cleanup complete.');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error cleaning database:', err);
    mongoose.connection.close();
  }
}

// Run the cleanup function
cleanDatabase();