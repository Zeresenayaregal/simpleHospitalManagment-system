const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this_in_prod';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Users API (Auth)
app.post('/api/register', async (req, res) => {
    try {
        const { email, name, role, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, name, and password are required' });
        }

        // Check if user exists
        const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            'INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
            [email, name, role || 'patient', hashedPassword]
        );
        const user = result.rows[0];

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ user, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Handle legacy users without password or check hash
        // Ideally we wouldn't have legacy users without password in a real migration, 
        // but for this prototype we assume new users or handled ones.
        // If password is 'hashed_placeholder' from migration and they try to login, it will fail, which is correct.

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // Don't send password back
        delete user.password;

        return res.json({ user, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userId = req.user.id; // From token

        let query = 'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email)';
        let params = [name, email];
        let paramCount = 3;

        // If password is provided, hash it and add to query
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = $${paramCount}`;
            params.push(hashedPassword);
            paramCount++;
        }

        query += ` WHERE id = $${paramCount} RETURNING id, name, email, role`;
        params.push(userId);

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        // Generate new token as details might have changed
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ user, token });
    } catch (err) {
        console.error(err);
        if (err.constraint === 'users_email_key') {
            return res.status(400).json({ error: 'Email already in use' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Patients API
app.get('/api/patients', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM patients');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const result = await db.query(
            'INSERT INTO patients (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone, address]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;
        const result = await db.query(
            'UPDATE patients SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), address = COALESCE($4, address) WHERE id = $5 RETURNING *',
            [name, email, phone, address, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM patients WHERE id = $1', [id]);
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Appointments API
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM appointments');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { patient_id, doctor_id, date, reason, status } = req.body;
        const pId = patient_id || req.body.patientId;
        const dId = doctor_id || req.body.doctorId;

        const result = await db.query(
            'INSERT INTO appointments (patient_id, doctor_id, date, reason, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [pId, dId, date, reason, status || 'scheduled']
        );

        const row = result.rows[0];
        res.json({ ...row, patientId: row.patient_id, doctorId: row.doctor_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date, reason } = req.body;

        const result = await db.query(
            'UPDATE appointments SET status = COALESCE($1, status), date = COALESCE($2, date), reason = COALESCE($3, reason) WHERE id = $4 RETURNING *',
            [status, date, reason, id]
        );
        const row = result.rows[0];
        if (row)
            res.json({ ...row, patientId: row.patient_id, doctorId: row.doctor_id });
        else res.status(404).json({ error: "Not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM appointments WHERE id = $1', [id]);
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Records API
app.get('/api/records', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM records');
        const rows = result.rows.map(r => ({ ...r, patientId: r.patient_id }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/records', authenticateToken, async (req, res) => {
    try {
        const { patientId, details, diagnosis, prescription } = req.body;
        const result = await db.query(
            'INSERT INTO records (patient_id, details, diagnosis, prescription) VALUES ($1, $2, $3, $4) RETURNING *',
            [patientId, details, diagnosis, prescription]
        );
        const row = result.rows[0];
        res.json({ ...row, patientId: row.patient_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { details, diagnosis, prescription } = req.body;
        const result = await db.query(
            'UPDATE records SET details = COALESCE($1, details), diagnosis = COALESCE($2, diagnosis), prescription = COALESCE($3, prescription) WHERE id = $4 RETURNING *',
            [details, diagnosis, prescription, id]
        );
        const row = result.rows[0];
        if (row) res.json({ ...row, patientId: row.patient_id });
        else res.status(404).json({ error: "Not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM records WHERE id = $1', [id]);
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files from the Vue frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// Handle SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
