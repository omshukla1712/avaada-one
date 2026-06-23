require('dotenv').config();
const express = require('express');
const router = express.Router();

router.post('/proxy/login', async(req,res)=>{
    console.log("================ LOGIN REQUEST ================");
    console.log("Payload Received:", JSON.stringify(req.body, null, 2));
    try{
        const avaada_url=`${process.env.AVAADA_BASE_URL}/public/user/login`;
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log(" ERROR: Proxy intercepted an empty body! Check express.json() middleware.");
        }
        const{emailid, oauth_token,provider}=req.body;

        // console.log(`Forwarding payload to Avaada production endpoint...`);
        const response=await fetch(avaada_url,{
            method:'POST',
            headers:{'Content-Type': 'application/json'},
            body:JSON.stringify(req.body)
        });
        const data=await response.json();
        console.log(`Response Received from Avaada Server (Status: ${response.status}):`);
        console.log(JSON.stringify(data, null, 2));
        console.log("========================================================");
        res.status(response.status).json(data);
    }catch(error){
        console.error(" SYSTEM CRASH IN PROXY:", error);
        res.status(500).json({error:"Proxy failed to reach Avaada"});
    }
});

router.get('/proxy/validate', async(req, res) => {
    console.log("================ VALIDATION REQUEST  ================");
    try {
        const avaada_url = `${process.env.AVAADA_BASE_URL}/public/auth/validate`;
        const authHeader = req.headers.authorization; 

        console.log(`Forwarding validation request to Avaada...`);
        const response = await fetch(avaada_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader || ''
            }
        });

        const data = await response.json();
        console.log(`Response Received from Avaada Server (Status: ${response.status}):`);
        console.log(JSON.stringify(data, null, 2));
        console.log("========================================================");
        
        res.status(response.status).json(data);
    } catch(error) {
        console.error("SYSTEM CRASH IN PROXY (VALIDATION):", error);
        res.status(500).json({ error: "Proxy failed to reach Avaada" });
    }
});

// router.post('/proxy/diagnose', async (req, res) => {
//     console.log("================ INCOMING PROXY REQUEST (DIAGNOSE) ================");
//     try {
//         const avaada_url = `${process.env.AVAADA_BASE_URL}/public/auth/diagnose-token`;
        
//         const response = await fetch(avaada_url, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(req.body)
//         });
        
//         const data = await response.json();
//         console.log(`Diagnostic Response from Avaada (Status: ${response.status}):`);
//         console.log(JSON.stringify(data, null, 2));
//         console.log("========================================================");
        
//         res.status(response.status).json(data);
//     } catch(error) {
//         console.error("SYSTEM CRASH IN PROXY:", error);
//         res.status(500).json({error: "Proxy failed to reach Avaada"});
//     }
// });

module.exports = router;