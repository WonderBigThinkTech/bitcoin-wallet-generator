const express = require('express');
const cors = require('cors');
const bitcoin = require('bitcoinjs-lib');
const qrcode = require('qrcode');
const tinysep = require('tiny-secp256k1');
const BIP32FACTORY = require('bip32').default;
const bip39 = require('bip39');


const app = express();

const cors_initial = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
}

app.use(express.json());
app.use(cors(cors_initial));

// s -- can not understand

const ecc = tinysep;

bitcoin.initEccLib(ecc);

const bip32 = BIP32FACTORY(ecc);

const network = bitcoin.networks.bitcoin;

// e -- can not understand

app.post('/generateSingleAddress', async (req, res) => {
    const {seedPhrase, type} = req.body;
    try{
        const seedBuffer = await bip39.mnemonicToSeed(seedPhrase);
        const root = bip32.fromSeed(seedBuffer, network);
        const child = root.derivePath("m/0'/0/0");
        const address = generateSingleAddress(child, type);
        
        const privateKey = root.toBase58();

        qrcode.toDataURL(address, (err, result) => {
            res.json({
                address : address,
                privateKey : privateKey,
                qrCode : result
            });
        });
    }
    catch(err){
        res.status(500).send("Address generation failed : " + err.message);
    }
});

const generateSingleAddress = (child, type) => {
    let address = '';
    const pubkey = Buffer.from(child.publicKey);

    switch(type){
        case "legacy":
            address = bitcoin.payments.p2pkh({
                pubkey : pubkey,
                network : network
            }).address;
        break;
        case "segwit":
            address = bitcoin.payments.p2wpkh({
                pubkey : pubkey,
                network : network
            }).address;
        break;
        case "nestedSegwit":
            address = bitcoin.payments.p2sh({
                pubkey : pubkey,
                network : network
            }).address;
        break;
        case "taproot":
            address = bitcoin.payments.p2tr({
                pubkey : pubkey,
                network : network
            }).address;
        break;
    }
    return address;
}

app.post('/generateAllAddresses', async (req, res) => {
    try{
        const mnemonic = bip39.generateMnemonic();
        const seedBuffer = await bip39.mnemonicToSeed(mnemonic);
        const root = bip32.fromSeed(seedBuffer, network);
        const addresses = generateAllAddress(root);
        
        const privateKey = root.toBase58();

        const qrCodes = await Promise.all(
            Object.values(addresses).map(async (address) => (qrcode.toDataURL(address)))
        );

        return res.json({
            mnemonic : mnemonic,
            privateKey : privateKey,
            addresses : addresses,
            qrCodes : qrCodes
        });

    }
    catch(err){
        return res.status(500).send('Error is occured : ' + err.message);
    };
})

const generateAllAddress = (root) => {
    const child = root.derivePath("m/0'/0/0");
    const pubkey = Buffer.from(child.publicKey);

    const addresses = {
        legacy : bitcoin.payments.p2pkh({
            pubkey : pubkey,
            network : network
        }).address,
        segwit : bitcoin.payments.p2wpkh({
            pubkey : pubkey,
            network : network
        }).address,
        nesteSegwit : bitcoin.payments.p2sh({
            redeem : bitcoin.payments.p2wpkh({
                pubkey : pubkey,
                network : network
            }),
            network : network
        }).address,
        taproot : bitcoin.payments.p2tr({
            pubkey : pubkey.slice(1, 33),
            network : network
        }).address,
    }
    return addresses;
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server is running on Port Number ${PORT}`));