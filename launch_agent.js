const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cp = require('child_process');

// Configuration Constants
const BASE_API_URL = 'qaschris.qtestnet.com'; // Replace with your qTest domain
const BEARER_TOKEN = '12075b0e-5390-450d-8fd3-3b28b26c8b8a'; // Replace with your API token
const TCSHELL_ARTIFACT_PATH = 'C:\\tmp\\Integration TCShell artifacts';
const JUMP_TO_TESTEVENT_FILE = path.join(TCSHELL_ARTIFACT_PATH, 'JumpToTestEvent.tcs');
const TOSCA_WORKSPACE = 'C:\\Tosca_Projects\\Tosca_Workspaces\\IntegrationTest1\\IntegrationTest1.tws';
const TCSHELL_EXECUTABLE = 'C:\\Program Files (x86)\\TRICENTIS\\Tosca Testsuite\\TCShell.exe';

// Retrieve the test run list from the environment variable
const testrunsList = JSON.parse($TESTRUNS_LIST || '[]');

// Function to get test run details if `tosca_guid` does not exist
async function getTestRunDetails(projectId, testRunId) {
    try {
        const response = await axios.get(`https://${BASE_API_URL}/api/v3/projects/${projectId}/test-runs/${testRunId}`, {
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
            }
        });
        return response.data.tosca_testevent_guid;
    } catch (error) {
        console.error(`[ERROR] Failed to retrieve test run ${testRunId}: ${error.message}`);
        return null;
    }
}

// Function to generate/modify JumpToTestEvent.tcs file
async function generateJumpToTestEvent(tosca_testevent_guid) {
    const content = `//jump to TestEvent
JumptoNode "/Execution/ExecutionLists/EL"
//Checkout Each ExecutionList
For "=>SUBPARTS->AllReferences:ExecutionList" TaskOnEach "Checkout Tree"
//jump to TestEvent
Task "Jump to Object" ${tosca_testevent_guid}
//Trigger the CustomIntegration for each ExecutionList
//Please Note: You would need to provide the complete path for the TriggerCustomIntegration.tcs file incase you are not placing in the same location as this file
For "=>SUBPARTS->AllReferences:ExecutionList" CallOnEach "./TriggerCustomIntegration.tcs"
//save the changes
checkinall
//exit`;

    // Ensure the artifact directory exists
    if (!fs.existsSync(TCSHELL_ARTIFACT_PATH)) {
        fs.mkdirSync(TCSHELL_ARTIFACT_PATH, { recursive: true });
    }

    // Write the content to the file
    try {
        fs.writeFileSync(JUMP_TO_TESTEVENT_FILE, content, 'utf8');
        console.log(`[INFO] JumpToTestEvent.tcs file created/modified successfully.`);
    } catch (error) {
        console.error(`[ERROR] Failed to write JumpToTestEvent.tcs file: ${error.message}`);
        throw error;
    }
}

// Function to execute the Tosca TCShell command
function executeTCShellCommand() {
    const command = `"${TCSHELL_EXECUTABLE}" -workspace "${TOSCA_WORKSPACE}" "${JUMP_TO_TESTEVENT_FILE}"`;
    console.log(`[INFO] Executing: ${command}`);

    try {
        cp.execSync(command, { stdio: 'inherit' });
        console.log('[INFO] TCShell command executed successfully.');
    } catch (error) {
        console.error(`[ERROR] TCShell execution failed: ${error.message}`);
        throw error;
    }
}

// Main function to process test runs and execute Tosca
async function main() {
    for (const testRun of testrunsList) {
        const { id: testRunId, tosca_guid } = testRun;
        let guid = tosca_guid;

        if (!guid) {
            // If tosca_guid doesn't exist, retrieve it via the API
            console.log(`[INFO] No tosca_guid for test run ${testRunId}, retrieving from API...`);
            guid = await getTestRunDetails(testRun.projectId, testRunId);
            if (!guid) {
                console.error(`[ERROR] Could not retrieve tosca_guid for test run ${testRunId}. Skipping.`);
                continue;
            }
        }

        // Generate or modify the JumpToTestEvent.tcs file with the retrieved guid
        await generateJumpToTestEvent(guid);

        // Execute the Tosca TCShell command
        executeTCShellCommand();
    }
}

// Start the main function
main().catch(error => {
    console.error(`[ERROR] Script failed: ${error.message}`);
    process.exit(1);
});
