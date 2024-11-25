const { batchTransfer } = require('./transfer');

async function main() {
    console.log('Starting batch transfers...');
    
    const results = await batchTransfer();
    
    console.log('\nTransfer Results:');
    console.log('Successful Transfers:', results.successful.length);
    console.log('Failed Transfers:', results.failed.length);
    
    if (results.successful.length > 0) {
        console.log('\nSuccessful Transactions:');
        results.successful.forEach(result => {
            console.log(`\nAddress: ${result.address}`);
            console.log(`TRX Transaction: https://shasta.tronscan.org/#/transaction/${result.trxTxId}`);
            console.log(`USDT Transaction: https://shasta.tronscan.org/#/transaction/${result.usdtTxId}`);
        });
    }
    
    if (results.failed.length > 0) {
        console.log('\nFailed Transactions:');
        results.failed.forEach(result => {
            console.log(`\nAddress: ${result.address}`);
            console.log(`Error: ${result.error}`);
        });
    }
}

main().catch(console.error);
