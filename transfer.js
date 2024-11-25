const TronWeb = require('tronweb');
const config = require('./config');

// Utility functions
const utils = {
    getTransactionUrl(txId) {
        return `https://shasta.tronscan.org/#/transaction/${txId}`;
    },

    async validateAddress(tronWeb, address) {
        return tronWeb.isAddress(address) && address.length === 34;
    },

    async waitForConfirmation(tronWeb, txId, maxRetries = 20) { // Increased retries
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const transaction = await tronWeb.trx.getTransactionInfo(txId);
                if (transaction && transaction.receipt) {
                    if (transaction.receipt.result === 'SUCCESS') {
                        return true;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 5000)); // Increased wait time
                retries++;
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries++;
            }
        }
        throw new Error('Transaction confirmation timeout');
    },

    logTransactionDetails(type, toAddress, amount, txId) {
        console.log(`\n=== ${type} Transfer Details ===`);
        console.log(`To Address: ${toAddress}`);
        console.log(`Amount: ${amount} ${type}`);
        console.log(`Transaction URL: ${this.getTransactionUrl(txId)}`);
        console.log(`Status: Confirmed`);
        console.log(`========================\n`);
    },

    async checkWalletBalance(tronWeb) {
        const balance = await tronWeb.trx.getBalance(config.FROM_ADDRESS);
        const balanceTRX = tronWeb.fromSun(balance);
        console.log(`\n=== Wallet Balance ===`);
        console.log(`Address: ${config.FROM_ADDRESS}`);
        console.log(`Balance: ${balanceTRX} TRX`);
        console.log(`=====================\n`);
        
        if (balanceTRX < 1000) {
            console.log(`Get testnet TRX from: https://www.trongrid.io/faucet`);
            throw new Error('Insufficient TRX balance for transactions');
        }
        return true;
    }
};

// TronWeb instance initialization
const tronWebOptions = {
    fullNode: config.NETWORK_URL,
    solidityNode: config.NETWORK_URL,
    eventServer: config.NETWORK_URL,
    privateKey: config.PRIVATE_KEY,
    timeout: 30000
};

if (config.API_KEY) {
    tronWebOptions.headers = { "TRON-PRO-API-KEY": config.API_KEY };
}

const tronWeb = new TronWeb(tronWebOptions);

// Core transfer functions
const transfers = {
    async transferTRX(toAddress, amount) {
        if (!await utils.validateAddress(tronWeb, toAddress)) {
            throw new Error(`Invalid TRON address: ${toAddress}`);
        }

        try {
            const transaction = await tronWeb.trx.sendTransaction(
                toAddress.trim(),
                tronWeb.toSun(amount),
                { shouldPollResponse: true }
            );

            await utils.waitForConfirmation(tronWeb, transaction.txid);
            utils.logTransactionDetails('TRX', toAddress, amount, transaction.txid);
            return transaction.txid;
        } catch (error) {
            throw new Error(`TRX Transfer failed: ${error.message || 'Unknown error'}`);
        }
    },

    async transferUSDT(toAddress, amount) {
        if (!await utils.validateAddress(tronWeb, toAddress)) {
            throw new Error(`Invalid TRON address: ${toAddress}`);
        }

        try {
            const contract = await tronWeb.contract().at(config.USDT_CONTRACT);
            const decimals = 6;
            const tokenAmount = amount * Math.pow(10, decimals);
            
            const transaction = await contract.transfer(
                toAddress.trim(),
                tokenAmount.toString()
            ).send({
                feeLimit: 100000000,
                shouldPollResponse: true
            });
            
            await utils.waitForConfirmation(tronWeb, transaction);
            utils.logTransactionDetails('USDT', toAddress, amount, transaction);
            return transaction;
        } catch (error) {
            throw new Error(`USDT Transfer failed: ${error.message || 'Unknown error'}`);
        }
    },

    async batchTransfer() {
        await utils.checkWalletBalance(tronWeb);
        const addresses = config.RECIPIENT_ADDRESSES.map(addr => addr.trim());
        const results = {
            successful: [],
            failed: []
        };

        for (const address of addresses) {
            try {
                if (!await utils.validateAddress(tronWeb, address)) {
                    throw new Error('Invalid address format');
                }

                const trxTxId = await this.transferTRX(address, config.TRX_AMOUNT);
                const usdtTxId = await this.transferUSDT(address, config.USDT_AMOUNT);
                
                results.successful.push({
                    address,
                    trxTxId,
                    usdtTxId
                });
            } catch (error) {
                results.failed.push({
                    address,
                    error: error.message || 'Transaction failed'
                });
            }
        }

        return results;
    }
};

module.exports = {
    transferTRX: transfers.transferTRX.bind(transfers),
    transferUSDT: transfers.transferUSDT.bind(transfers),
    batchTransfer: transfers.batchTransfer.bind(transfers)
};
