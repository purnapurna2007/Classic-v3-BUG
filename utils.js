const axios = require('axios');

async function getBuffer(url) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data, 'binary');
}

module.exports = { getBuffer };
