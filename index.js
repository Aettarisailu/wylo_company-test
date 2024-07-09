const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB connection
const mongodb_url = "mongodb+srv://nanisaimedia:Dzz6ACykBKlJtCb7@cluster0.7i80y3t.mongodb.net/postsDB";

mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Post Schema
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    imageUrl: String,
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// Routes
app.put('/posts/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.likes += 1;
        await post.save();
        res.json(post);
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).send('Server Error');
    }
});

app.put('/posts/:id/dislike', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.dislikes += 1;
        await post.save();
        res.json(post);
    } catch (err) {
        console.error('Error disliking post:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

app.delete('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

app.get('/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.json(post);
    } catch (err) {
        console.error('Error fetching post:', err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

app.put('/posts/:id', upload.single('image'), async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                content: req.body.content,
                imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl
            },
            { new: true }
        );
        if (!updatedPost) {
            return res.status(404).send('Post not found');
        }
        res.json(updatedPost);
    } catch (err) {
        console.error('Error updating post:', err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

app.post('/posts', upload.single('image'), async (req, res) => {
    try {
        const newPost = new Post({
            title: req.body.title,
            content: req.body.content,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : ''
        });
        await newPost.save();
        res.json(newPost);
    } catch (err) {
        console.error('Error creating post:', err.message, err.stack);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 5020;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
