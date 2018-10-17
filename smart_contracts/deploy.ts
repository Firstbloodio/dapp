import * as Web3 from 'web3';
import * as commandLineArgs from 'command-line-args';
import * as Tx from 'ethereumjs-tx';
import * as fs from 'fs';
import * as ethabi from 'ethereumjs-abi';
import * as request from 'request';
import * as keythereum from 'keythereum';
import * as ethUtil from 'ethereumjs-util';

const contractsDir = 'contracts';
const compiledJSON = `${contractsDir}/compiled.json`;

const cli = [
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'privateKey', type: String },
  { name: 'ethProvider', type: String, defaultValue: 'https://kovan.infura.io/Za7wVPPWB81BCrN95zy1' },
  { name: 'gasPrice', type: Number, defaultValue: 4000000000 },
  { name: 'network', type: String, defaultValue: 'kovan' },
  { name: 'armed', type: Boolean, defaultValue: false },
];
const cliOptions = commandLineArgs(cli);

const web3 = new Web3();

fs.readFile(compiledJSON, { encoding: 'utf8' }, (err, result) => {
  const compiled = JSON.parse(result);

  const generateContractData = (contractName, constructorParams) => {
    const contracts = compiled.contracts;
    const abi = JSON.parse(contracts[contractName].interface);
    const bytecode = contracts[contractName].bytecode;
    const contract = web3.eth.contract(abi);
    const constructTypes = abi.filter(x => x.type === 'constructor')[0].inputs.map(x => x.type);
    const abiEncoded = ethabi.rawEncode(constructTypes, constructorParams);
    const ABIConstructor = abiEncoded.toString('hex');
    const data = `0x${contract.new.getData.apply(null, constructorParams.concat({ data: bytecode }))}`;
    return { data, ABIConstructor };
  };

  const generateTransactionData = (contractName, contractAddress, functionName, argumentList) => {
    const contracts = compiled.contracts;
    const abi = JSON.parse(contracts[contractName].interface);
    const contract = web3.eth.contract(abi).at(contractAddress);
    const data = `${contract[functionName].getData.apply(null, argumentList)}`;
    return { data };
  };

  const generateRawTransaction = (pkIn, nonceIn, to, data, valueIn, gasLimitIn, gasPriceIn) => {
    const value = web3.toHex(web3.toWei(valueIn, 'Ether'));
    const gasLimit = web3.toHex(gasLimitIn);
    const gasPrice = web3.toHex(gasPriceIn);
    const nonce = web3.toHex(nonceIn);
    const privateKey = new Buffer(pkIn, 'hex');
    const rawTx = {
      nonce,
      gasPrice,
      gasLimit,
      to,
      value,
      data,
    };
    const tx = new Tx(rawTx);
    tx.sign(privateKey);
    const address = keythereum.privateKeyToAddress(pkIn);
    const serializedTx = `0x${tx.serialize().toString('hex')}`;
    const contractAddress = `0x${ethUtil.generateAddress(address, nonceIn).toString('hex')}`;
    return { serializedTx, contractAddress };
  };

  const getNonce = address => new Promise((resolve, reject) => {
    const url = `https://${cliOptions.network === 'mainnet' ? 'api' :
      cliOptions.network}.etherscan.io/api?module=proxy&action=eth_GetTransactionCount&address=${address}&tag=latest`;
    request(url, (error, response, body) => {
      try {
        const nonce = parseInt(JSON.parse(body).result, 16);
        resolve(nonce);
      } catch (err) {
        reject(err);
      }
    });
  });

  const sendRawTransaction = rawTx => new Promise((resolve, reject) => {
    if (cliOptions.armed) {
      const url = `https://${cliOptions.network === 'mainnet' ? 'api' : cliOptions.network}.etherscan.io/api`;
      request.post(
        { url, form: { module: 'proxy', action: 'eth_sendRawTransaction', hex: rawTx } },
        (error, response, body) => {
          if (!error) {
            const txHash = JSON.parse(body).result;
            resolve(txHash);
          } else {
            reject(error);
          }
        });
    } else {
      console.log('Not armed, not sending transaction.');
      resolve('No transaction hash -- not armed');
    }
  });

  const generateContractAndSend = (contractName, argumentList, nonce) =>
    new Promise((resolve, reject) => {
      const { data, ABIConstructor } = generateContractData(contractName, argumentList);
      const result = generateRawTransaction(
        cliOptions.privateKey,
        nonce,
        undefined,
        data,
        0,
        4000000,
        cliOptions.gasPrice);
      const { serializedTx, contractAddress } = result;
      sendRawTransaction(serializedTx)
      .then(txHash => resolve({ txHash, contractAddress, ABIConstructor }))
      .catch(err => reject(err));
    });

  const generateTransactionAndSend =
    (contractName, contractAddress, functionName, argumentList, value, gas, nonce) =>
    new Promise((resolve, reject) => {
      const { data } = generateTransactionData(
        contractName, contractAddress, functionName, argumentList);
      const result = generateRawTransaction(
        cliOptions.privateKey,
        nonce,
        contractAddress,
        data,
        value,
        gas,
        cliOptions.gasPrice);
      const { serializedTx } = result;
      sendRawTransaction(serializedTx)
      .then(txHash => resolve({ txHash }))
      .catch(err => reject(err));
    });

  if (cliOptions.help) {
    console.log(cli);
  } else {
    web3.setProvider(new web3.providers.HttpProvider(cliOptions.ethProvider));
    // const contractName = /(.*?)\((.*?)\)/g.exec(cliOptions.contract)[1];
    // const argumentList = /(.*?)\((.*?)\)/g.exec(cliOptions.contract)[2].split(',');
    console.log('Compiler', compiled.solcVersion);
    const address = keythereum.privateKeyToAddress(cliOptions.privateKey);
    let nonce;
    let FirstBloodTokenAddress;
    let WitnessJuryAddress;
    let ChallengeFactoryAddress;
    getNonce(address)
    .then((nonceResult) => {
      nonce = nonceResult;

    // If deploying to testnet, use this:
    //   return generateContractAndSend(
    //     'ReserveToken', ['FirstBloodToken', '1ST'], nonce);
    // })
    // .then(({ txHash, contractAddress, ABIConstructor }) => {
    //   FirstBloodTokenAddress = contractAddress;
    //   console.log('FirstBloodToken', 'ReserveToken', FirstBloodTokenAddress, ABIConstructor);
    //   console.log(txHash);
    //   nonce += 1;

    // If deploying to mainnet, use this:
      FirstBloodTokenAddress = '0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7';

      return generateContractAndSend(
        'WitnessJury', [FirstBloodTokenAddress], nonce);
    })
    .then(({ txHash, contractAddress, ABIConstructor }) => {
      WitnessJuryAddress = contractAddress;
      console.log('WitnessJury', 'WitnessJury', WitnessJuryAddress, ABIConstructor);
      console.log(txHash);
      nonce += 1;
      return generateContractAndSend(
        'ChallengeFactory', [WitnessJuryAddress, FirstBloodTokenAddress], nonce);
    })
    .then(({ txHash, contractAddress, ABIConstructor }) => {
      ChallengeFactoryAddress = contractAddress;
      console.log('ChallengeFactory', 'ChallengeFactory', ChallengeFactoryAddress, ABIConstructor);
      console.log(txHash);
      console.log(`
  contracts:
    1ST:
      type: 'StandardToken'
      address: '${FirstBloodTokenAddress}'
    WitnessJury:
      type: 'WitnessJury'
      address: '${WitnessJuryAddress}'
    ChallengeFactory:
      type: 'ChallengeFactory'
      address: '${ChallengeFactoryAddress}'
  `);
    })
    .catch((err) => {
      console.log('Error', err);
    });
  }
});
