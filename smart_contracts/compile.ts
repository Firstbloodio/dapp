import { LogFactory } from './services/Log';
import * as fs from 'fs';
import globFs = require('glob-fs');
import solc = require('solc');

const log = LogFactory('Smart contract compiler');
const glob: any = globFs({});
const solidityVersion = '0.4.19';
const solcVersion = 'v0.4.19+commit.c4cbbb05';
const contractsDir = 'contracts';
const mainFile = `${contractsDir}/Main.sol`;
const compiledJSON = `${contractsDir}/compiled.json`;
const compiledSource = `${contractsDir}/Compiled.sol`;

export function compile(callback, force = false) {
  fs.readFile(compiledJSON, { encoding: 'utf8' }, (err, result) => {
    if (!err && result.length > 0 && !force) {
      const compiled = JSON.parse(result);
      callback(null, compiled);
    } else {
      const readFile = file => new Promise((resolve, reject) => {
        fs.readFile(file, { encoding: 'utf8' }, (errReadFile, data) => {
          if (errReadFile) {
            reject(errReadFile);
          } else {
            resolve({ file, data });
          }
        });
      });

      glob.readdir(`${contractsDir}/*.sol`, (errReadDir, files) => {
        Promise.all(files.map(readFile))
          .then((inputArray) => {
            const input = inputArray.reduce((a: any, b: any) => Object.assign(a, { [b.file]: b.data }), {});
            solc.loadRemoteVersion(solcVersion, (errLoad, solcV) => {
              const regex = /import "(.*?)";/g;
              let source = input[mainFile];
              let match = regex.exec(input[mainFile]);
              while (match) {
                source = source.replace(match[0], input[`${contractsDir}/${match[1]}`]);
                match = regex.exec(input[mainFile]);
              }
              source = `pragma solidity ^${solidityVersion};
// last compiled with ${solcVersion};

${source}
              `;
              const output = solcV.compile({ sources: { [mainFile]: source } }, 1);
              output.errors.forEach((error) => {
                log.error(error);
              });
              fs.writeFile(compiledSource, source, () => {
                log.info(`Wrote ${compiledSource}`);
              });
              const prefix = `${mainFile}:`;
              Object.keys(output.contracts).forEach((key) => {
                output.contracts[key.slice(prefix.length)] = output.contracts[key];
                delete output.contracts[key];
              });
              Object.keys(output.contracts).forEach((contractName) => {
                output.contracts[contractName].abi = JSON.parse(output.contracts[contractName].interface);
              });
              const json = { solcVersion, contracts: output.contracts };
              fs.writeFile(compiledJSON,
                JSON.stringify(json), () => {
                  log.info(`Wrote ${compiledJSON}`);
                });
            });
          })
          .catch((errPromise) => {
            log.error(errPromise);
          });
      });
    }
  });
}

if (require.main === module) {
  compile((err) => {
    if (err) {
      log.error(err);
    } else {
      log.info('Done compiling contracts');
    }
  }, true);
}
