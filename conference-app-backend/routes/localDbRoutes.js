require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');


// GET /api/v1/local-db/get-offices
router.get('/get-offices', async (req, res) => {
    console.log("--> [LOCAL DB] Fetching Offices via SQL (Contract Compliant)...");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchString = req.query.searchString || '';
    const status = req.query.status;

    try {
        let queryText = `SELECT id, name, location FROM offices WHERE 1=1`;
        let queryParams = [];
        let paramIndex = 1;

        if (searchString) {
            queryText += ` AND name ILIKE $${paramIndex}`;
            queryParams.push(`%${searchString}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY id ASC`;

        const result = await db.query(queryText, queryParams);

        const formattedRows = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            location: row.location,
            address: {}, 
            status: 1   
        }));

        const count = formattedRows.length;
        const totalPages = Math.ceil(count / limit) || 1;
        
        const paginatedRows = formattedRows.slice((page - 1) * limit, page * limit);

        res.status(200).json({
            success: true,
            status: 200,
            message: "Offices fetched successfully",
            body: {
                data: {
                    rows: paginatedRows,
                    count: count,
                    currentPage: page,
                    totalPages: totalPages
                }
            }
        });

    } catch (error) {
        console.error("Local DB Offices Fetch Failed:", error);
        res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
});


// GET /api/v1/local-db/get-bookings
router.get('/get-bookings', async (req, res) => {
    console.log("--> [LOCAL DB] Fetching Bookings via SQL (Contract Compliant)...");
    
    const { status, office_id, searchString, user_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const safeUserId = user_id || ((req.user && req.user.id) ? req.user.id : 123);
    
    try {
        let queryText = `
            SELECT DISTINCT 
                   b.id, 
                   b.title, 
                   r.office_id,
                   b.status, 
                   b.final_approval, 
                   TO_CHAR(b.start_date, 'YYYY-MM-DD') as start_date, 
                   TO_CHAR(b.end_date, 'YYYY-MM-DD') as end_date,
                   TO_CHAR(b.start_time, 'HH24:MI:SS') as start_time, 
                   TO_CHAR(b.end_time, 'HH24:MI:SS') as end_time, 
                   r.id as room_id,
                   r.name as room_name 
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            LEFT JOIN booking_participants bp ON b.id = bp.booking_id
            WHERE (b.user_id = $1 OR bp.user_id = $1)
        `;
        
        const queryParams = [safeUserId];
        let paramIndex = 2;

        if (status) {
            queryText += ` AND b.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }
        
        if (office_id) {
            queryText += ` AND r.office_id = $${paramIndex}`;
            queryParams.push(office_id);
            paramIndex++;
        }

        if (searchString) {
            queryText += ` AND b.title ILIKE $${paramIndex}`; 
            queryParams.push(`%${searchString}%`);
            paramIndex++;
        }

        queryText += ` ORDER BY start_date ASC, start_time ASC`;

        const result = await db.query(queryText, queryParams);

        const formattedRows = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            office_id: row.office_id,
            start_date: row.start_date,
            end_date: row.end_date || row.start_date, 
            start_time: row.start_time,
            end_time: row.end_time,
            status: row.status,
            final_approval: row.final_approval,
            conference_rooms: [
                { id: row.room_id, room_name: row.room_name }
            ]
        }));

        const count = formattedRows.length;
        const totalPages = Math.ceil(count / limit) || 1;
        const paginatedRows = formattedRows.slice((page - 1) * limit, page * limit);
        
        res.status(200).json({
            success: true,
            status: 200,
            message: "Bookings fetched successfully",
            body: {
                data: {
                    rows: paginatedRows,
                    count: count,
                    currentPage: page,
                    totalPages: totalPages
                }
            }
        });

    } catch (error) {
        console.error("Local DB Query Failed:", error);
        res.status(500).json({ success: false, message: "Database Error" });
    }
});

// POST /api/v1/local-db/create-booking
router.post('/create-booking', async (req, res) => {
    console.log("--> [LOCAL DB] Creating New Booking via SQL (Contract Compliant)...");
    const safeUserId = user_id || (req.user && req.user.id) || 123;
    try {
        const { 
            office_id, 
            conference_room_ids, 
            title, 
            start_date, 
            end_date, 
            start_time, 
            end_time, 
            number_of_members, 
            frequency, 
            user_id 
        } = req.body;

        const safeRoomId = (conference_room_ids && conference_room_ids.length > 0) 
            ? conference_room_ids[0] 
            : null;

        if (!safeRoomId) {
            throw new Error("No room selected");
        }

        const safeUserId = user_id || (req.user && req.user.id) ? req.user.id : 123;
        const safeTitle = title || 'Ad-Hoc Meeting';
        const safeEndDate = end_date || start_date;
        const safeFreq = frequency || 'NONE';

        const result = await db.query(`
            INSERT INTO bookings 
                (title, status, final_approval, start_date, end_date, start_time, end_time, room_id, user_id, frequency)
            VALUES 
                ($1, 'ACTIVE', 'APPROVED', $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, title, status, final_approval
        `, [safeTitle, start_date, safeEndDate, start_time, end_time, safeRoomId, safeUserId, safeFreq]);

        const newBooking = result.rows[0];

        res.status(200).json({
            success: true,
            status: 200,
            message: "Booking created successfully",
            body: {
                data: {
                    id: newBooking.id,
                    title: newBooking.title,
                    status: newBooking.status,
                    final_approval: newBooking.final_approval
                }
            }
        });

    } catch (error) {
        console.error("🚨 Local DB Insert Failed:", error);
        res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
});



// GET /api/v1/local-db/get-office-admin-details
router.get('/get-office-admin-details', async (req, res) => {
    console.log("--> [LOCAL DB] Fetching Admin Directory via SQL (Contract Compliant)...");
    
    const office_id = req.query.office_id || null;

    try {
        let queryText = `
            SELECT 
                ad.id, 
                ad.full_name, 
                ad.email, 
                ad.role_name, 
                ad.office_name,
                o.id AS real_office_id,
                o.location AS office_location
            FROM admin_directory ad
            LEFT JOIN offices o ON ad.office_name = o.name
            WHERE 1=1
        `;
        let queryParams = [];
        let paramIndex = 1;

        if (office_id) {
            queryText += ` AND o.id = $${paramIndex}`;
            queryParams.push(office_id);
        }

        const result = await db.query(queryText, queryParams);
        
        const formattedAdmins = result.rows.map(admin => ({
            id: admin.id,
            name: admin.full_name,
            email: admin.email,
            role: admin.role_name,
            role_code: admin.role_name ? admin.role_name.toUpperCase().replace(' ', '_') : 'ADMIN',
            office: { 
                id: admin.real_office_id,     
                name: admin.office_name, 
                location: admin.office_location 
            }
        }));

        res.status(200).json({
            success: true,
            status: 200,
            message: "Office admin details retrieved successfully",
            body: { 
                data: formattedAdmins 
            }
        });

    } catch (error) {
        console.error("Local DB Admin Query Failed:", error);
        res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
});


// PUT /api/v1/local-db/update-booking-status
router.put('/update-booking-status', async (req, res) => {
    console.log("--> [LOCAL DB] Updating Booking Status via SQL (Contract Compliant)...");
    
    const { booking_id, status, cancellation_reason, final_approval, rejection_remarks } = req.body;

    try {
        const result = await db.query(
            `UPDATE bookings 
             SET status = COALESCE($1, status), 
                 final_approval = COALESCE($2, final_approval)
             WHERE id = $3 
             RETURNING id, status, final_approval`,
            [status, final_approval, booking_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found in local DB" });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Booking status updated successfully",
            body: {
                data: {
                    id: result.rows[0].id,
                    status: result.rows[0].status,
                    final_approval: result.rows[0].final_approval
                }
            }
        });

    } catch (error) {
        console.error("Local DB Update Failed:", error);
        res.status(500).json({ success: false, message: "Database Update Error", error: error.message });
    }
});

// GET /api/v1/local-db/search-available-rooms
router.get('/search-available-rooms', async (req, res) => {
    console.log("--> [LOCAL DB] Searching Available Rooms via SQL (Time-Aware)...");
    
    const { 
        office_id, 
        start_date, 
        end_date, 
        start_time, 
        end_time, 
        number_of_members 
    } = req.query;
    
    const rawAmenities = req.query.required_amenities || req.query['required_amenities[]'];

    try {
        const requiredCapacity = parseInt(number_of_members) || 1;

        const result = await db.query(`
            SELECT r.id, r.name as room_name, r.capacity, r.office_id,
                   COALESCE(
                       json_agg(json_build_object('id', a.id, 'amenity_name', a.name)) 
                       FILTER (WHERE a.id IS NOT NULL), '[]'::json
                   ) as amenities
            FROM rooms r
            LEFT JOIN room_amenities ra ON r.id = ra.room_id
            LEFT JOIN amenities a ON ra.amenity_id = a.id
            WHERE r.office_id = $1 
              AND r.capacity >= $2
              AND r.id NOT IN (
                  SELECT room_id FROM bookings
                  WHERE status != 'CANCELLED'
                    AND start_date <= $4 AND end_date >= $3
                    AND start_time < $6 AND end_time > $5
              )
            GROUP BY r.id
        `, [office_id, requiredCapacity, start_date, end_date, start_time, end_time]);

        let validRooms = result.rows;

        if (rawAmenities) {
            let requestedAmens = [];

            if (typeof rawAmenities === 'string') {
                const cleanString = rawAmenities.replace(/\[|\]/g, '');
                requestedAmens = cleanString.split(',').map(Number);
            } else if (Array.isArray(rawAmenities)) {
                requestedAmens = rawAmenities.map(Number);
            }

            requestedAmens = requestedAmens.filter(n => !isNaN(n));

            if (requestedAmens.length > 0) {
                validRooms = validRooms.filter(room => {
                    const roomAmenitiesArray = typeof room.amenities === 'string' 
                        ? JSON.parse(room.amenities) 
                        : room.amenities;

                    const roomAmenityIds = roomAmenitiesArray.map(a => a.id);
                    return requestedAmens.every(reqId => roomAmenityIds.includes(reqId));
                });
            }
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Available rooms fetched successfully",
            body: {
                data: validRooms
            }
        });

    } catch (error) {
        console.error("Local DB Room Search Failed:", error);
        res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
});


router.get('/get-users', async (req, res) => {
    console.log("================ INCOMING PROXY REQUEST (GET USERS) ================");
    try {
        const queryString = new URLSearchParams(req.query).toString();
        const avaada_url = `${process.env.AVAADA_BASE_URL}/public/get-users${queryString ? `?${queryString}` : ''}`;
        
        console.log(`Forwarding to Avaada: ${avaada_url}`);
        const response = await fetch(avaada_url, {
            method: 'GET',
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

// GET /api/v1/local-db/get-user-offices
router.get('/get-user-offices', async (req, res) => {
    console.log("--> [LOCAL DB] Fetching User Role/Office...");

    try {
        const safeUserId = (req.user && req.user.id) ? req.user.id : 123;

        const adminCheck = await db.query(`
            SELECT ad.role_name, ad.office_name 
            FROM admin_directory ad
            JOIN users u ON ad.email = u.email
            WHERE u.id = $1
        `, [safeUserId]);

        let officeName = "Corporate Headquarters";
        let roleName = "Employee";

        if (adminCheck.rows.length > 0) {
            officeName = adminCheck.rows[0].office_name;
            roleName = adminCheck.rows[0].role_name;
        }         
        res.status(200).json({
            success: true,
            status: 200,
            message: "User office data fetched successfully",
            body: {
                data: [
                    {
                        office: { name: officeName },
                        role: { role_name: roleName }
                    }
                ]
            }
        });

    } catch (error) {
        console.error("🚨 Local DB User Offices Fetch Failed:", error);
        res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
});

// GET /api/v1/local-db/get-booking-details
router.get('/get-booking-details', async (req, res) => {
    console.log("--> [LOCAL DB] Fetching Deep Booking Details via SQL (Contract Compliant)...");
    
    const idToFetch = req.query.booking_id || req.query.id;

    if (!idToFetch) {
        return res.status(400).json({ success: false, message: "Missing booking_id parameter" });
    }

    try {
        const result = await db.query(`
            SELECT b.*, r.name as room_name, o.name as office_name, u.email as organizer_email
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN offices o ON r.office_id = o.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.id = $1
        `, [idToFetch]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const row = result.rows[0];

        const participantsResult = await db.query(`
            SELECT bp.user_id, u.email 
            FROM booking_participants bp
            JOIN users u ON bp.user_id = u.id
            WHERE bp.booking_id = $1
        `, [idToFetch]);

        let participantsArray = [
            { email: row.organizer_email, user_id: row.user_id }
        ];

        participantsResult.rows.forEach(p => {
            if (p.user_id !== row.user_id) {
                participantsArray.push({ email: p.email, user_id: p.user_id });
            }
        });

        const formattedData = {
            id: row.id,
            title: row.title,
            office_id: row.office_id,
            user_id: row.user_id,
            start_date: row.start_date,
            end_date: row.end_date || row.start_date, 
            start_time: row.start_time,
            end_time: row.end_time,
            status: row.status,
            final_approval: row.final_approval,
            frequency: row.frequency || "NONE",
            
            office_name: row.office_name,
            room_name: row.room_name,
            
            conference_rooms: [
                { id: row.room_id, name: row.room_name } 
            ],
            participants: participantsArray 
        };

        res.status(200).json({
            success: true,
            status: 200,
            message: "Booking details fetched successfully",
            body: {
                data: formattedData
            }
        });

    } catch (error) {
        console.error("Local DB Booking Details Fetch Failed:", error);
        res.status(500).json({ success: false, message: "Database Error", error: error.message });
    }
});

module.exports = router;