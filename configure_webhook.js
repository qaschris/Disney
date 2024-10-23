const axios = require('axios');

// Your bearer token
const token = 'f3058983-af4f-4fa3-a66c-38d472957cde';

// API endpoint URL
const apiUrl = 'https://qaschris.qtestnet.com/api/v3/webhooks';

// Payload for the POST request
const payload = {
    name: 'ToscaReportAutomation',
    url: 'https://pulse-7.qtestnet.com/webhook/73aaa488-12a9-40c4-bf87-b76a0ff587b4',
    events: ['testlog_submitted'],
    secretKey: 'none',
    responseType: 'json',
    projectIds: [9211]
};

// Axios POST request configuration
const config = {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

// Make the POST request
axios.post(apiUrl, payload, config)
    .then(response => {
        console.log('POST Response:', response.data);
    })
    .catch(error => {
        console.error('POST Error: "', error.response ? error.response.data : error.message);
        console.error(JSON.stringify(error));
    });
