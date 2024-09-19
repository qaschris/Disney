const cp = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// This function checks the size of the payload
const formatSizeUnits = async (bytes) => {
    return bytes > 0 ? (bytes / 1048576).toFixed(4) : 0;
}

// This function moves processed files to a 'processed' subfolder
const moveProcessedFiles = async (directoryPath, files) => {
    const processedDir = path.join(directoryPath, 'processed');
    
    try {
        await fs.mkdir(processedDir, { recursive: true }); // Ensure 'processed' directory exists

        for (const file of files) {
            const oldPath = path.join(directoryPath, file);
            const newPath = path.join(processedDir, file);
            await fs.rename(oldPath, newPath);
        }

        console.log(`[INFO] Moved ${files.length} processed files to the "processed" subfolder successfully.`);
    } catch (error) {
        console.error(`[ERROR]: Failed to move processed files: ${error.message}`);
    }
}

// Main function to process and send files
const main = async () => {
    // Configuration Section
    const pulseUri = 'https://pulse-7.qtestnet.com/webhook/0e3e4e06-3b5f-47f4-9afe-704317355dc6'; // Pulse parser webhook endpoint
    const projectId = '122526'; // Target qTest Project ID
    const cycleId = '5325050'; // Target qTest Test Cycle ID
    const resultsPath = 'C:\\Users\\chrpe.TRICENTIS\\OneDrive - TRICENTIS\\Documents\\Repository\\Testing Ground\\Disney\\Codeception\\allure-results'; // Results directory path
    // End Configuration Section

    try {
        const files = await fs.readdir(resultsPath);
        const resultFiles = files.filter(file => file.endsWith('-result.json'));

        console.log(`[INFO] Found ${resultFiles.length} result JSON files to ship.`);

        if (resultFiles.length === 0) {
            console.log('[INFO] No result files found. Exiting.');
            return;
        }

        // Initialize an array to hold all JSON data
        const jsonArray = [];

        for (const file of resultFiles) {
            const filePath = path.join(resultsPath, file);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);

            jsonArray.push(jsonData);
        }

        // Add a bit of *spice*
        const buff = Buffer.from(JSON.stringify(jsonArray)); // Convert to string before buffer
        const base64data = buff.toString('base64'); // Base64 encoding for security and special characters

        const payloadBody = {
            'projectId': projectId,
            'testcycle': cycleId,
            'result': base64data
        };

        // Check the payload size to make sure it'll fit, needs to be <=50MB
        let bufferSize = await formatSizeUnits(Buffer.byteLength(JSON.stringify(payloadBody), 'utf8'));
    
        console.log(`[INFO] Payload size is ${bufferSize} MB.`);
        if (bufferSize > 50) {
            console.log('[ERROR] Payload size is greater than 50 MB cap.');
            return;
        }

        // Send the concatenated JSON array to the webhook
        console.log('[INFO] Uploading results...');
        const response = await axios.post(pulseUri, payloadBody);
        for (let r = 0; r < response.data.length; r++) {
            console.log('[INFO] Status: ' + response.data[r].status + ', execution id: ' + response.data[r].id + '');
        }
        console.log('[INFO] Uploaded results successfully.');

        // Move processed files to the 'processed' subfolder
        await moveProcessedFiles(resultsPath, resultFiles);

    } catch (error) {
        console.error(`[ERROR]: Error sending concatenated results to webhook: ${error.message}`);
        return;
    }
};

main();
