import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

// GET /get-users
export const searchUsers = async (query) => {
    try {
        const response = await api.get('/conference/get-users', { 
            params: { searchString: query,status: 'active',page: 1 ,limit: 3 } 
        });
        const json = response.data;
        let safeArray=[];
        if(Array.isArray(json))safeArray=json;
        else if(json?.body?.data?.rows)safeArray=json.body.data.rows;
        else if(json?.data?.rows)safeArray=json.data.rows;
        else if(json?.data && Array.isArray(json.data))safeArray=json.data;
        return safeArray;
    } catch (error) {
        console.error('Error fetching users:', error.message); 
        throw error;
    }
};

// GET /get-bookings
export const fetchUserBookings = async (params = {}) => {

    try {
        const userId = await AsyncStorage.getItem('userId') || 1; 
        const response = await api.get('/conference/get-bookings', {
            params: {user_id: userId,
                page:1,
                limit:10,
                ...params
            }
        });
 

        const json=response.data;
        return json?.body?.data?.rows||json?.body?.data|| json?.data||[];
    } catch (error) {
        console.error('Error fetching user bookings:', error.message);
        throw error;
    }
};

// GET /get-user-offices
export const fetchUserOffices = async () => {
    try {
        const response = await api.get('/conference/get-user-offices');
        const json = response.data;
        
        return json?.body?.data || json?.data || [];
    } catch (error) {
        console.error('Error fetching user offices:', error.message);
        throw error; 
    }
};

// GET /campus-schedule
export const getCampusSchedule = async (filters = {}) => {
    try {
        const params = {
            page: 1,
            limit: 20,
            ...filters 
        };

        const response = await api.get('/conference/get-bookings', { params });
        const json = response.data;
        
        return json?.body?.data?.rows || json?.body?.data || json?.data || [];
    } catch (error) {
        console.error('Error fetching campus schedule:', error.message);
        throw error;
    }
};

// GET /get-booking-details
export const getBookingDetails = async (booking_id) => {
    try {
        const response = await api.get('/conference/get-booking-details', {
            params: { booking_id }
        });
        const json = response.data;
        
        return json?.body?.data || json?.data || null;
    } catch (error) {
        console.error('Error fetching booking details:', error.message);
        throw error;
    }
};

// GET /get-offices
export const getOffices = async (params = {}) => {
    try {
        const response = await api.get('/conference/get-offices', { params });
        const json = response.data;
        return json?.body?.data?.rows || json?.body?.data || json?.data || [];
    } catch (error) {
        console.error('Error fetching offices:', error);
        throw error;
    }
};

// GET /get-user-offices
export const getUserOffices = async () => {
    try {
        const response = await api.get('/conference/get-user-offices');
        const json = response.data;

        return json?.body?.data || json?.data || [];
    } catch (error) {
        console.error('Error fetching user offices:', error);
        throw error;
    }
};

// GET /get-office-admin-details 
export const fetchAdminDirectory = async (officeId = null) => {
    try {
        const params = officeId ? { office_id: officeId } : {};
        const response = await api.get('/conference/get-office-admin-details', { params });
        const json = response.data;
        
        return json?.body?.data || json?.data || [];
    } catch (error) {
        console.error('Error fetching admin directory:', error.message);
        throw error;
    }
};

// GET /search-available-rooms
export const searchAvailableRooms = async ({ office_id, start_date, end_date, start_time, end_time, number_of_members = 1, required_amenities }) => {
    try {
        const params = { office_id, start_date, end_date, start_time, end_time, number_of_members };
        if (required_amenities) params.required_amenities = required_amenities;
 
        const response = await api.get('/conference/search-available-rooms', { params });
        const json = response.data;
        
        return json?.body?.data || json?.data || [];
    } catch (error) {
        console.error('Error searching available rooms:', error);
        throw error;
    }
};

// POST /create-booking
export const createBooking = async (bookingData) => {
    try {
        const requestBody={payload:bookingData}
        const response = await api.post('/conference/create-booking', bookingData);
        const json = response.data;
        return { 
            success: json.success, 
            message: json.message, 
            data: json?.body?.data || json?.data 
        };
    } catch (error) {
        console.error('Error creating booking:', error.response?.data?.error || error.message);
        throw error;
    }
};

// PUT /update-booking-status
export const updateBookingStatus = async ({ booking_id, status, cancellation_reason, final_approval, rejection_remarks }) => {
    try {
        const response = await api.put('/conference/update-booking-status', { 
            booking_id, 
            status, 
            cancellation_reason, 
            final_approval, 
            rejection_remarks 
        });
        const json = response.data;
        
        return { 
            success: json.success, 
            message: json.message, 
            data: json?.body?.data || json?.data 
        };
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
};

export const cancelBooking = async (bookingId, cancellationReason) => {
    return updateBookingStatus({
        booking_id: bookingId,
        status: 'CANCELLED',
        cancellation_reason: cancellationReason,
    });
};

export default {
    fetchUserBookings,
    getCampusSchedule,
    getOffices,
    getUserOffices,
    searchAvailableRooms,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    searchUsers,
    getBookingDetails,
    fetchUserOffices,
};