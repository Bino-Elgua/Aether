'use strict';

const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('dashboard/public'));

app.get('/api/agents', (req, res) => {
    // Return mock agent state
    res.json([{ id: 'nexus-prime', tier: 'moderate', status: 'active' }]);
});

app.listen(3000, () => console.log('Aether Dashboard running on http://localhost:3000'));
