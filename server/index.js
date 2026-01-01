const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Users API (Auth)
app.post('/api/register', async (req, res) => {
    try {
        const { email, name, role } = req.body;
        // Check if user exists
        const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            return res.json({ user, token: `mock-token-${user.id}` });
        }

        const result = await db.query(
            'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
            [email, name, role || 'patient']
        );
        const user = result.rows[0];
        res.json({ user, token: `mock-token-${user.id}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Mock login logic preserved with DB check
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            return res.json({ user, token: `mock-token-${user.id}` });
        } else {
            // Auto-create for prototype feel if not found (mimics previous mock behavior)
            let role = 'patient';
            if (email.includes('doctor')) role = 'doctor';
            if (email.includes('admin')) role = 'admin';

            const newUser = await db.query(
                'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *',
                [email, email.split('@')[0], role]
            );
            const user = newUser.rows[0];
            return res.json({ user, token: `mock-token-${user.id}` });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Patients API
app.get('/api/patients', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM patients');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/patients', async (req, res) => {
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

app.put('/api/patients/:id', async (req, res) => {
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

app.delete('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM patients WHERE id = $1', [id]);
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Appointments API
app.get('/api/appointments', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM appointments');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', async (req, res) => {
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

app.put('/api/appointments/:id', async (req, res) => {
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

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM appointments WHERE id = $1', [id]);
        res.json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Records API
app.get('/api/records', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM records');
        const rows = result.rows.map(r => ({ ...r, patientId: r.patient_id }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/records', async (req, res) => {
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

app.put('/api/records/:id', async (req, res) => {
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

app.delete('/api/records/:id', async (req, res) => {
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
