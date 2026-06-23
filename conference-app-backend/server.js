require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const localDbRoutes = require('./routes/localDbRoutes');


const app = express();
app.use(cors()); 
app.use(express.json()); 

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
            console.log(` PAYLOAD (Body):`);
            console.log(JSON.stringify(req.body, null, 2));
        }
        if (req.query && Object.keys(req.query).length > 0) {
            console.log(` QUERIES (Params):`);
            console.log(JSON.stringify(req.query, null, 2));
        }
        console.log(`======================================\n`);
    next();
});
app.use('/api/v1/conference', authRoutes);
app.use('/api/v1/conference', bookingRoutes); 
app.use('/api/v1/local-db', localDbRoutes);




app.get('/health', (req, res) => {
    res.json({ status: "Backend is live" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});