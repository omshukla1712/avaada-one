require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');


const upload = multer({storage:multer.memoryStorage()});

function generateWeeklyDates(startDateStr, endDateStr, weekdays) {
    const dates = [];
    let current = new Date(startDateStr);
    const end = new Date(endDateStr);
    while (current <= end) {
        if (weekdays.includes(current.getUTCDay())) {
            dates.push(current.toISOString().split('T')[0]); 
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return dates;
}

// GET MENUS (Protected Proxy - Role-Based UI)
router.get('/get-menus', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET MENUS) ================");
    try {
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-menus`;
        
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding menu lookup to Avaada...`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET MENUS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: [] } 
        });
    }
});

// GET Offices (Public Proxy)
router.get('/get-offices', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET OFFICES) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/public/get-offices${queryString ? `?${queryString}` : ''}`;
        
        console.log(`Forwarding to Avaada: ${avaada_url}`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET OFFICES):", error);

        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: {} }
        });
    }
});

// GET Users (Public Proxy for meeting_with lookup)
router.get('/get-users', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET USERS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/public/get-users${queryString ? `?${queryString}` : ''}`;
        
        console.log(`Forwarding to Avaada: ${avaada_url}`);
        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET USERS):", error);
        
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: {} }
        });
    }
});

// GET USERS (Protected Proxy - Directory Search)
router.get('/get-users-master', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET USERS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-users${queryString ? `?${queryString}` : ''}`;

        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding user search to Avaada: ${avaada_url}`);
        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET USERS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: { rows: [], count: 0 } } 
        });
    }
});

// GET USER OFFICES AND ROLES (Protected Proxy)
router.get('/get-user-offices', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET USER OFFICES) ================");
    try {
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-user-offices`;
        
        const authHeader = req.headers.authorization; 
        
        if (!authHeader) {
            console.log("PROXY BLOCKED: No Authorization header provided by frontend.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding secure request to Avaada...`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader 
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET USER OFFICES):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: [] }
        });
    }
});

// GET OFFICE ADMIN DETAILS (Protected Proxy)
router.get(['/get-office-admin-details', '/get-office-admins'], async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET ADMINS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-office-admin-details${queryString ? `?${queryString}` : ''}`;
        
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding admin lookup to Avaada: ${avaada_url}`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET ADMINS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: [] } 
        });
    }
});

// GET AVAILABLE ROOMS (Protected Proxy)
router.get('/search-available-rooms', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (SEARCH ROOMS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/search-available-rooms${queryString ? `?${queryString}` : ''}`;
        
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding room search to Avaada: ${avaada_url}`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (SEARCH ROOMS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: [] } 
        });
    }
});


// GET BOOKINGS (Protected Proxy)
router.get('/get-bookings', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET BOOKINGS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-bookings${queryString ? `?${queryString}` : ''}`;

        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding bookings fetch to Avaada: ${avaada_url}`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET BOOKINGS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { 
                data: { rows: [], count: 0, currentPage: 1, totalPages: 0 } 
            }
        });
    }
});

// POST CREATE BOOKING (Protected Proxy)
router.post('/create-booking', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (CREATE BOOKING) ================");
    try {
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/create-booking`;
        
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding booking payload to Avaada...`);
        console.log(`Payload:`, JSON.stringify(req.body, null, 2));

        const response = await fetch(avaada_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(req.body) 
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (CREATE BOOKING):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: {} } 
        });
    }
});

// router.post('/bulk-upload', upload.single('file'), async(req,res)=>{
//     console.log("================ INCOMING PROXY REQUEST (BULK UPLOAD) ================");
//     try{
//     if(!req.file){
//         console.log("PROXY ERROR: No file detected in request.");
//         return res.status(400).json({success:false, message: "No CSV file uploaded"});
//     }
//     console.log(`File caught in memory: ${req.file.originalname} (${req.file.size} bytes)`);
  
//         console.log(" HEADERS RECEIVED:", req.headers);

//     const authHeader = req.headers.authorization;
//     if(!authHeader){
//         console.log("PROXY BLOCKED: Missing Authorization header.");
//         return res.status(401).json({success:false, message:"Missing token"});
//     }

//     console.log(`Repackaging file for Avaada...`);
//     const proxyFormData = new FormData();
//         const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        
//         proxyFormData.append('file', fileBlob, req.file.originalname);

//         const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/bulk-upload`;
//         console.log(`Sending payload to: ${avaada_url}`);

//         const response = await fetch(avaada_url, {
//             method: 'POST',
//             headers: {
//                 'Authorization': authHeader
//             },
//             body: proxyFormData
//         });
//         console.log(`Response Received from Avaada Server (Status: ${response.status})`);
//        const contentType = response.headers.get('content-type');
        
//         // CONDITION A: (The 207 Error CSV)
//         if (contentType && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
//             console.log(" Avaada returned a file! Piping CSV back to client...");
            
//             const arrayBuffer = await response.arrayBuffer();
//             const buffer = Buffer.from(arrayBuffer);

//             res.setHeader('Content-Type', 'text/csv');
//             res.setHeader('Content-Disposition', 'attachment; filename=error_records.csv');
            
//             // Send the raw file
//             console.log("========================================================");
//             return res.status(response.status).send(buffer);
//         }

//         // CONDITION B:(Success, 400, 401, etc.)
//         console.log("Avaada returned JSON. Parsing normally...");
//         const data = await response.json();
//         console.log("========================================================");
        
//         return res.status(response.status).json(data);
//     }catch(error){
//         console.error("SYSTEM CRASH IN PROXY (BULK UPLOAD):", error);
//         res.status(500).json({ success: false, message: "Proxy failed to reach Avaada" });
//     }
// });

// PUT UPDATE BOOKING STATUS (Protected Proxy)
router.put('/update-booking-status', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (UPDATE STATUS) ================");
    try {
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/update-booking-status`;
   
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding status update payload to Avaada...`);
        console.log(`Payload:`, JSON.stringify(req.body, null, 2));

        const response = await fetch(avaada_url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (UPDATE STATUS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: {} } 
        });
    }
});


// GET OFFICES (Protected Proxy)(CONFERENCE)
router.get('/get-offices-conference', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET OFFICES CONFERENCE) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-offices${queryString ? `?${queryString}` : ''}`;
        
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding to Avaada: ${avaada_url}`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET OFFICES CONFERENCE):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { 
                data: { rows: [], count: 0, currentPage: 1, totalPages: 0 } 
            }
        });
    }
});

// GET BOOKING DETAILS (Protected Proxy)
router.get('/get-booking-details', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET BOOKING DETAILS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/conference/get-booking-details${queryString ? `?${queryString}` : ''}`;
    
        const authHeader = req.headers.authorization; 
        if (!authHeader) {
            console.log("PROXY BLOCKED: Missing Authorization header.");
            return res.status(401).json({ success: false, message: "Missing token" });
        }

        console.log(`Forwarding booking details lookup to Avaada: ${avaada_url}`);

        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        
        console.log(`Response Received from Avaada Server (Status: ${response.status})`);
        console.log("========================================================");

        res.status(response.status).json(data);

    } catch (error) {
        console.error("SYSTEM CRASH IN PROXY (GET BOOKING DETAILS):", error);
        res.status(500).json({ 
            success: false, 
            status: 500,
            message: "Proxy failed to reach Avaada",
            body: { data: null } 
        });
    }
});


module.exports = router;