import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function fetchParticipants(eventId, token) {
    try {
        // console.log(`Fetching participants for event ${eventId}...`);
        const response = await axios.get(
            `${process.env.EVENTS_API_BASE_URL}/api/registration/${eventId}/users`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        // console.log(`Successfully fetched ${response.data.length} participants for event ${eventId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching participants: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        }
        throw new Error(`Failed to fetch participants: ${error.message}`);
    }
}

async function fetchEventDetails(eventId, token) {
    try {
        // console.log(`Fetching details for event ${eventId}...`);
        const response = await axios.get(
            `${process.env.EVENTS_API_BASE_URL}/api/events/${eventId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        // console.log(`Successfully fetched details for event ${eventId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching event details: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        }
        throw new Error(`Failed to fetch event details: ${error.message}`);
    }
}

async function fetchWinners(eventId, token) {
    try {
        // console.log(`Fetching winners for event ${eventId}...`);
        const response = await axios.get(
            `${process.env.EVENTS_API_BASE_URL}/api/Result/event/${eventId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        // console.log(`Successfully fetched ${response.data.results.length} winners for event ${eventId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching winners: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        }
        throw new Error(`Failed to fetch winners: ${error.message}`);
    }
}

export {
    fetchParticipants,
    fetchEventDetails,
    fetchWinners
};
