const db = require('./db');

(async () => {
    try {
        console.log('Testing connection...');
        const result = await db.query('SELECT NOW()');
        console.log('Connection successful: ' + result.rows[0].now);
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error.message);
        process.exit(1);
    }
})();
