const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
require('./config/db');

const { profileDb, logsDb } = require('./config/db');

const User = require('./models/User');
const AuditLog = require('./models/AuditLog');

const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
//mongoose
//    .connect(process.env.MONGO_URI)
  //  .then(() => console.log('Connected to MongoDB'))
    //.catch((err) => console.error('Error connecting to MongoDB:', err));

//Middleware to check JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) 
        {
         return res.status(401).json({ message: 'Access denied. No token provided' });
        }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided' });
    }

    try {
        const verifieduser = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verifieduser;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Access denied. Invalid token' });
    }
} //end of authenticateToken middleware

async function createAuditLog(username, action, description) {
    try {
        await AuditLog.create({
            username,
            action,
            description
        });
    } catch (error) {
        console.error('Error creating audit log:', error.message);
    }
}

//Test routes
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

//API status route
app.get('/api/status', (req, res) => {
    try{
        const profileDbStatus = profileDb.readyState === 1 ? 'connected' : 'disconnected';
        const logsDbStatus = logsDb.readyState === 1 ? 'connected' : 'disconnected';

        res.json({
            message: 'API status check successful',
            appName: 'Profile Management API',
            version: '1.0.0',
            serverTime: new Date().toISOString(),
            databases: {
                profileDb: profileDbStatus, //first database
                logsDb: logsDbStatus //second database
            },
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Error checking API status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    message: 'Version control demo update',
    updatedBy: 'SE_22025'
  });
});


//Temporary registration route for testing
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, phone, dob } = req.body;

        if (!username || !password || !email || !phone || !dob) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            phone,
            dob
        });

        await newUser.save();
        await createAuditLog(
            username,
            'User Registration',
            `New user registered with username: ${username}`
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}); //end of registration route

//Login route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            await createAuditLog(
            username,
            'Invalid',
            `Invalid username or password`
        );

            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        await createAuditLog(
            username,
            'User Login',
            `User logged in with username: ${username}`
        );

        res.json({ 
            message: 'Login successful',
            token 
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Server error' });
    }
}); //end of login route

//get logged-in user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
}); //end of get profile route

//update logged-in user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { email, phone, dob } = req.body;

        if (!email || !phone || !dob) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                email,
                phone,
                dob
            },
            { 
                new: true
            }
        ).select('-password');

        await createAuditLog(
            req.user.username,
            'Profile Update',
            `User updated profile information`
        );

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
}); //end of update profile route

app.get('/api/auditlogs', async (req, res) => {
    try {
        const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(100);

        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;