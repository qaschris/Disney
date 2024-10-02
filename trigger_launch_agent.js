const PulseSdk = require('@qasymphony/pulse-sdk');
const axios = require('axios');

// DO NOT EDIT exported "handler" function is the entry point
exports.handler = async function ({ event: body, constants, triggers }, context, callback) {
    // Your bearer token and base API URL
    const token = '12075b0e-5390-450d-8fd3-3b28b26c8b8a'; // Service account bearer token
    const baseUrl = 'https://qaschris.qtestnet.com/api/v3';  // Your base API URL
    // Retrieve these from /api/v3/automation/automation-agents for the configured Agent
    const clientId = 7028;  // host_id
    const agentId = 21772;  // id

    // Axios GET and POST request configurations
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const projectId = body.testlog.project_id;
    const testRunId = body.testlog.testrun_id;

    try {
        // Step 1: Make GET call to retrieve test run info using testRunId
        const testRunResponse = await axios.get(`${baseUrl}/projects/${projectId}/test-runs/${testRunId}`, config);
        const testRunData = testRunResponse.data;

        // Step 2: Extract parentId and parentType from the test run
        const parentId = testRunData.parentId;
        const parentType = testRunData.parentType;

        // Step 3: Call GET /test-runs with parentId to retrieve all test runs in the suite
        const suiteTestRunsResponse = await axios.get(
            `${baseUrl}/projects/${projectId}/test-runs?parentId=${parentId}&parentType=${parentType}&expand=descendants`,
            config
        );
        const suiteTestRuns = suiteTestRunsResponse.data.items;

        // Step 4: Check if the incoming testRunId matches the first test run in the suite
        if (suiteTestRuns.length > 0 && suiteTestRuns[0].id === testRunId) {
            // Continue with scheduling the agent if testRunId matches the first test run
            console.log(`[INFO]: Test run ID ${testRunId} is the first in the suite, scheduling the agent...`);

            const apiUrl = `${baseUrl}/automation/jobs/schedule/create`;

            // Payload for the POST request
            const payload = {
                clientId: clientId,
                name: 'Trigger Tosca TCShell Report',
                agentId: agentId,
                projectId: projectId,
                testRunIds: [testRunId],
                dynamic: {
                    additionalProp1: 'string',
                    additionalProp2: 'string',
                    additionalProp3: 'string'
                }
            };

            // Make the POST request to schedule the agent
            const scheduleResponse = await axios.post(apiUrl, payload, config);
            console.log('POST Response:', JSON.stringify(scheduleResponse.data));

        } else {
            // Log a message and quit if the testRunId is not the first one in the suite
            console.log(`[INFO]: Test run ID ${testRunId} is NOT the first in the suite. Exiting...`);
            return;
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};
