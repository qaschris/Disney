const axios = require('axios');

// Configuration for API call
const token = '12075b0e-5390-450d-8fd3-3b28b26c8b8a'; // Replace with your actual token
const baseUrl = 'https://qaschris.qtestnet.com'; // Replace with your base URL
const apiUrl = `${baseUrl}/api/v3/automation/automation-agents`;

// Payload for the POST request
const payload = {
    "fields": ["*"],
    "query": "'name' ~ 'ToscaTCShellExecution'"
};

// Axios POST request configuration
const config = {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

// Function to make the POST request
const getAutomationAgents = async () => {
    try {
        const response = await axios.post(apiUrl, payload, config);
        console.log('POST Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('POST Error:', error.response ? error.response.data : error.message);
    }
};

// Call the function
getAutomationAgents();
