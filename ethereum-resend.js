#!/usr/bin/env node

const Web3 = require('web3')
const yargs = require('yargs')
const tracer = require('tracer')
const BN = require('bn.js')

const logger = tracer.colorConsole()
const argv = yargs(process.argv.slice(2)).options({
    'privkey': {
        alias: 'k',
        demandOption: true,
        describe: 'private key used for signing',
        type: 'string'
    },
    'txhash': {
        alias: 't',
        demandOption: true,
        describe: 'transaction hash that needs to be resent',
        type: 'string'
    },
    'provider': {
        alias: 'p',
        demandOption: true,
        describe: 'web3 provider, e.g ws://127.0.0.1:8550',
        type: 'string'
    },
    'resend': {
        alias: 's',
        default: false,
        describe: 'resend the transaction with the same parameters',
        type: 'boolean'
    },
    'cancel': {
        alias: 'c',
        default: false,
        describe: 'cancel the transaction',
        type: 'boolean'
    },
    'gasprice': {
        alias: 'g',
        default: '-1',
        describe: 'the gasprice of the new transaction',
        type: 'string'
    },
    'gasprice_numerator': {
        alias: 'n',
        default: '-1',
        describe: 'the numerator of gasprice',
        type: 'string'
    },
    'gasprice_denominator': {
        alias: 'd',
        default: '-1',
        describe: 'the denominator of gasprice',
        type: 'string'
    }
}).argv

if (argv.cancel === argv.resend) {
    logger.error('invalid params, cancel or resend')
    process.exit(1)
}

let defaultGasPrice = false
if (argv.gasprice === '-1') {
    if (argv.gasprice_numerator === '-1' || argv.gasprice_denominator === '-1') {
        logger.info('use defaultGasPrice')
        defaultGasPrice = true
    }
    else {
        logger.info(`use gasprice defaultGasPrice * ${argv.gasprice_numerator} / ${argv.gasprice_denominator}`)
    }
}
else {
    logger.info(`use gasprice ${argv.gasprice}`)
}

(async () => {
    try {
        const web3 = new Web3(argv.provider)
        web3.eth.accounts.wallet.add(argv.privkey)
        web3.eth.handleRevert = true
    
        // calculate new price.
        let gasPrice
        if (argv.gasprice !== '-1') {
            gasPrice = new BN(argv.gasprice)
        }
        else if (defaultGasPrice) {
            gasPrice = new BN(await web3.eth.getGasPrice())
        }
        else {
            gasPrice = new BN(await web3.eth.getGasPrice()).mul(new BN(argv.gasprice_numerator)).div(new BN(argv.gasprice_denominator))
        }

        let tx = await web3.eth.getTransaction(argv.txhash)
        if (tx.blockHash !== null || tx.blockNumber !== null) {
            logger.error(`tx ${txhash} already persist in block`)
            process.exit(1)
        }
        if (tx.from !== web3.eth.accounts.wallet[0].address) {
            logger.error(`from ${tx.from} not equal to ${web3.eth.accounts.wallet[0].address}`)
            process.exit(1)
        }
        if (gasPrice.lte(new BN(tx.gasPrice))) {
            if (defaultGasPrice) {
                let oldGasPrice = new BN(tx.gasPrice)
                gasPrice = oldGasPrice.muln(11).divn(10)
                if (gasPrice.lte(oldGasPrice)) {
                    gasPrice = oldGasPrice.muln(2)
                }
            }
            else {
                logger.error(`new transaction gasprice ${gasPrice.toString()} less or equal than old transaction gasprice ${tx.gasPrice}`)
                process.exit(1)
            }
        }
        logger.info(`new gasprice: ${gasPrice.toString()}`)
        logger.info(`find pending tx: ${JSON.stringify(tx, null, '  ')}`)

        let newTx
        if (argv.resend) {
            newTx = {
                from: tx.from,
                to: tx.to,
                value: tx.value,
                gas: tx.gas,
                gasPrice: gasPrice.toString(),
                data: tx.input,
                nonce: tx.nonce
            }
        }
        else {
            newTx = {
                from: tx.from,
                to: '0x0000000000000000000000000000000000000000',
                value: 0,
                gas: 21000,
                gasPrice: gasPrice.toString(),
                data: '',
                nonce: tx.nonce
            }
        }
        logger.info(`append new tx: ${JSON.stringify(newTx, null, '  ')}`)

        web3.eth.sendTransaction(newTx)
        .on('transactionHash', (newTxHash) => {
            logger.info(`send new transaction successfully, txhash: ${newTxHash}`)
        })
        .on('receipt', (receipt) => {
            logger.info(`get new transaction receipt successfully!, ${JSON.stringify(receipt, null, '  ')}`)
            process.exit(0)
        })
        .on('error', (err) => {
            logger.error(`send new transaction failed!, error: ${err}`)
            process.exit(1)
        })
    }
    catch(err) {
        logger.error('catch error: ', err)
        process.exit(1)
    }
})()


