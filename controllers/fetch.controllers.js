const axios = require('axios');

async function fetchParticipants(eventId, token) {
    try {
        const response = await axios.get(
            `https://excel-events-service-42324430635.asia-south1.run.app/api/registration/${eventId}/users`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch participants: ${error.message}`);
    }
}

async function fetchEventDetails(eventId, token) {
    try {
        const response = await axios.get(
            `https://excel-events-service-42324430635.asia-south1.run.app/api/events/${eventId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch event details: ${error.message}`);
    }
}

async function fetchWinners(eventId, token) {
    try {
        const response = await axios.get(
            `https://excel-events-service-42324430635.asia-south1.run.app/api/Result/event/${eventId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch winners: ${error.message}`);
    }
}

module.exports = {
    fetchParticipants,
    fetchEventDetails,
    fetchWinners
};
