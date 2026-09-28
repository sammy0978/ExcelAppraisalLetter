'use strict';

const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = req.url;

    try {

        if (req.method === 'POST' && url === '/generate-letter') {
            await generateLetter(req, res);
            return;
        }

        if (req.method === 'GET' && url === '/get-letter') {
            await getLetter(req, res);
            return;
        }

        if (req.method === 'POST' && url === '/send-letter') {
            await sendLetter(req, res);
            return;
        }

        res.writeHead(404, {
            'Content-Type': 'application/json'
        });

        res.write(JSON.stringify({
            success: false,
            message: 'Endpoint not found'
        }));

        res.end();

    } catch (error) {

        console.error(error);

        res.writeHead(500, {
            'Content-Type': 'application/json'
        });

        res.write(JSON.stringify({
            success: false,
            message: 'Internal server error',
            error: error.message
        }));

        res.end();
    }
};


async function generateLetter(req, res) {

    const catalystApp = catalyst.initialize(req);

    const body = await getRequestBody(req);

    const performanceId = body.performanceId;

    if (!performanceId) {

        res.writeHead(400, {
            'Content-Type': 'application/json'
        });

        res.write(JSON.stringify({
            success: false,
            message: 'performanceId is required'
        }));

        res.end();
        return;
    }

    const query =
        `SELECT * FROM Performance WHERE Performance_ID = '${performanceId}'`;

    const result = await catalystApp
        .zcql()
        .executeZCQLQuery(query);

    if (!result || result.length === 0) {

        res.writeHead(404, {
            'Content-Type': 'application/json'
        });

        res.write(JSON.stringify({
            success: false,
            message: 'Performance record not found'
        }));

        res.end();
        return;
    }

    const performance = result[0].Performance;

    const hike = performance.Hike_Percentage;
    const bonus = performance.Performance_Bonus;

    if (hike === null || hike === undefined ||
        bonus === null || bonus === undefined) {

        res.writeHead(400, {
            'Content-Type': 'application/json'
        });

        res.write(JSON.stringify({
            success: false,
            message: 'Hike percentage and performance bonus are required'
        }));

        res.end();
        return;
    }

    if (Number(hike) < 0 || Number(bonus) < 0) {

        res.writeHead(400, {
            'Content-Type': 'application/json'
        });

        res.write(JSON.stringify({
            success: false,
            message: 'Hike percentage and performance bonus cannot be negative'
        }));

        res.end();
        return;
    }

    let letterType = '';

    if (Number(hike) > 0 && Number(bonus) === 0) {
        letterType = 'Hike Letter';
    }
    else if (Number(hike) === 0 && Number(bonus) > 0) {
        letterType = 'Performance Bonus Letter';
    }
    else if (Number(hike) > 0 && Number(bonus) > 0) {
        letterType = 'Hike + Performance Bonus Letter';
    }
    else {
        letterType = 'No Letter';
    }

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.write(JSON.stringify({
        success: true,
        performanceId: performanceId,
        hikePercentage: hike,
        performanceBonus: bonus,
        letterType: letterType
    }));

    res.end();
}


async function getLetter(req, res) {

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.write(JSON.stringify({
        success: true,
        message: 'Get letter endpoint is ready'
    }));

    res.end();
}


async function sendLetter(req, res) {

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.write(JSON.stringify({
        success: true,
        message: 'Send letter endpoint is ready'
    }));

    res.end();
}


function getRequestBody(req) {

    return new Promise((resolve, reject) => {

        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {

            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });

        req.on('error', error => {
            reject(error);
        });
    });
}