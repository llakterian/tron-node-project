require('dotenv').config();

module.exports = {
    PRIVATE_KEY: process.env.PRIVATE_KEY || '',
    FROM_ADDRESS: process.env.FROM_ADDRESS || '',
    NETWORK_URL: 'https://api.shasta.trongrid.io',
    USDT_CONTRACT: 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj',
    RECIPIENT_ADDRESSES: process.env.RECIPIENT_ADDRESSES ? process.env.RECIPIENT_ADDRESSES.split(',') : [],
    TRX_AMOUNT: parseFloat(process.env.TRX_AMOUNT || '100'),
    USDT_AMOUNT: parseFloat(process.env.USDT_AMOUNT || '10')
};
