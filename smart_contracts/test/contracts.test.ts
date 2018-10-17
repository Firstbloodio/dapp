import 'mocha';
import { expect } from 'chai';
import * as Web3 from 'web3';
import * as TestRPC from 'ethereumjs-testrpc';
import { BigNumber } from 'bignumber.js';
import { BN } from 'bn.js';
import { compile } from '../compile';
import * as ethUtil from 'ethereumjs-util';
import * as abi from 'ethereumjs-abi';
import * as rlp from 'rlp';
import * as keccak from 'keccak';
import * as async from 'async';

const web3 = new Web3();

const toWei = amount => new BigNumber(web3.toWei(amount, 'ether'));

const sign = (address, message) => new Promise((resolve, reject) => {
  web3.eth.sign(address, message, (err, result) => {
    if (err) reject(err);
    const sig = ethUtil.fromRpcSig(result);
    const r = `0x${sig.r.toString('hex')}`;
    const s = `0x${sig.s.toString('hex')}`;
    const v = sig.v;
    resolve({ r, s, v });
  });
});

const deploy = (compiledContract, argumentList, from, gas, gasPrice) =>
  new Promise((resolve, reject) => {
    const abi = JSON.parse(compiledContract.interface);
    const bytecode = compiledContract.bytecode;
    const contract: any = web3.eth.contract(abi);
    argumentList.push({ from, gas, gasPrice, data: bytecode });
    argumentList.push((err, myContract) => {
      if (!err) {
        if (myContract.address) {
          const finalContract = contract.at(myContract.address);
          resolve(finalContract);
        }
      } else {
        reject(err);
      }
    });
    contract.new(...argumentList);
  });

describe('Smart contract', function () {
  this.timeout(30000);
  const port = 12345;
  const gasPrice = 4000000000; // 4 gwei
  const accounts = [];
  let owner;
  let provider;
  let server;
  let contracts;
  let FirstTokenContract;
  let WitnessJuryContract;
  let ChallengeFactoryContract;
  const ChallengeContracts = [];
  const requests = [];
  const logger = {
    log: (message) => {
      // console.log(message);
    },
  };

  before((done) => {
    server = TestRPC.server({
      logger,
      total_accounts: 120,
      mnemonic: 'dead fish racket soul plunger dirty boats cracker mammal nicholas cage',
    });
    server.listen(port, () => {
      provider = new web3.providers.HttpProvider(`http://localhost:${port}`);
      web3.setProvider(provider);
      web3.eth.getAccounts((err, accs) => {
        expect(err).to.equal(null);
        accs.forEach(acc => accounts.push(acc));
        owner = accounts[0];
        done();
      });
    });
  });

  before((done) => {
    compile((err, result) => {
      expect(err).to.equal(null);
      contracts = result.contracts;
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  it('Should deploy a test token (1ST) contract', (done) => {
    const from = owner;
    const gas = 1500000;
    const contractName = 'ReserveToken';
    const argumentList = ['FirstBlood', '1ST'];
    const compiledContract = contracts[contractName];
    deploy(compiledContract, argumentList, from, gas, gasPrice)
      .then((contract) => {
        FirstTokenContract = contract;
        done();
      });
  });

  it('Should deploy a WitnessJury contract', (done) => {
    const from = owner;
    const gas = 4000000;
    const contractName = 'WitnessJury';
    const argumentList = [FirstTokenContract.address];
    const compiledContract = contracts[contractName];
    deploy(compiledContract, argumentList, from, gas, gasPrice)
      .then((contract) => {
        WitnessJuryContract = contract;
        done();
      });
  });

  it('Should deploy a challenge factory contract', (done) => {
    const from = owner;
    const gas = 4000000;
    const contractName = 'ChallengeFactory';
    const argumentList = [WitnessJuryContract.address, FirstTokenContract.address];
    const compiledContract = contracts[contractName];
    deploy(compiledContract, argumentList, from, gas, gasPrice)
      .then((contract) => {
        ChallengeFactoryContract = contract;
        done();
      });
  });

  it('Should create some 1ST', (done) => {
    const from = owner;
    const gas = 100000;
    const value = 0;
    const tokens = toWei(2000);
    FirstTokenContract.create(from, tokens, { value, from, gas, gasPrice }, (err) => {
      expect(err).to.equal(null);
      done();
    });
  });

  it('Should distribute some 1ST', (done) => {
    const from = owner;
    const gas = 100000;
    const value = 0;
    const tokens = toWei(10);
    const transfer = (to, amount) => new Promise((resolve) => {
      FirstTokenContract.transfer(to, amount, { value, from, gas, gasPrice }, (err) => {
        expect(err).to.equal(null);
        resolve();
      });
    });
    Promise.all(accounts.slice(1).map(account => transfer(account, tokens)))
      .then(() => {
        done();
      });
  });

  it('Should transfer some 1ST', (done) => {
    const from = accounts[1];
    const to = accounts[2];
    const gas = 100000;
    const value = 0;
    const amount = toWei(1);
    const checkBalance = (account, expectedAmount) => new Promise((resolve) => {
      FirstTokenContract.balanceOf(account, (err, result) => {
        expect(err).to.equal(null);
        expect(result.equals(expectedAmount)).to.equal(true);
        resolve();
      });
    });
    FirstTokenContract.transfer(to, amount, { value, from, gas, gasPrice }, (err) => {
      expect(err).to.equal(null);
      Promise.all([
        checkBalance(from, toWei(9)),
        checkBalance(to, toWei(11)),
      ])
        .then(() => {
          done();
        });
    });
  });

  it('Should deposit to WitnessJury contract', (done) => {
    const from = accounts[1];
    const value = 0;
    const gas = 250000;
    const amount = toWei(1);
    FirstTokenContract.approve(
      WitnessJuryContract.address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        WitnessJuryContract.deposit(amount, { value, from, gas, gasPrice }, (errDeposit) => {
          expect(errDeposit).to.equal(null);
          done();
        });
      });
  });

  it('Should check witness balance', (done) => {
    const account = accounts[1];
    const expectedAmount = toWei(1);
    WitnessJuryContract.balanceOf(account, (err, result) => {
      expect(err).to.equal(null);
      expect(result.equals(expectedAmount)).to.equal(true);
      done();
    });
  });

  it('Should withdraw from WitnessJury contract', (done) => {
    const from = accounts[1];
    const value = 0;
    const gas = 250000;
    const amount = toWei(0.5);
    WitnessJuryContract.withdraw(amount, { value, from, gas, gasPrice }, (err) => {
      expect(err).to.equal(null);
      done();
    });
  });

  it('Should check witness balance', (done) => {
    const account = accounts[1];
    const expectedAmount = toWei(0.5);
    WitnessJuryContract.balanceOf(account, (err, result) => {
      expect(err).to.equal(null);
      expect(result.equals(expectedAmount)).to.equal(true);
      done();
    });
  });

  it('Should deposit to witness contract (first witness)', (done) => {
    const from = accounts[1];
    const value = 0;
    const gas = 250000;
    const amount = toWei(1);
    FirstTokenContract.approve(WitnessJuryContract.address, amount, { value, from, gas, gasPrice }, (errApprove) => {
      expect(errApprove).to.equal(null);
      WitnessJuryContract.deposit(amount, { value, from, gas, gasPrice }, (errDeposit) => {
        expect(errDeposit).to.equal(null);
        done();
      });
    });
  });

  it('Should deposit to witness contract (second witness)', (done) => {
    const from = accounts[2];
    const value = 0;
    const gas = 250000;
    const amount = toWei(1);
    FirstTokenContract.approve(WitnessJuryContract.address, amount, { value, from, gas, gasPrice }, (errApprove) => {
      expect(errApprove).to.equal(null);
      WitnessJuryContract.deposit(amount, { value, from, gas, gasPrice }, (errDeposit) => {
        expect(errDeposit).to.equal(null);
        done();
      });
    });
  });

  describe('Challenge with no jury, and a referrer', () => {

    it('Should create a new challenge', (done) => {
      // Note: in real life, you should be able to call ChallengeFactory.newChallenge
      // This doesn't seem to work in testRPC because Challenge has too many
      // storage variables. Haven't tried it on the real blockchain yet...
      const from = accounts[3];
      const gas = 2500000;
      const contractName = 'Challenge';
      const amount = toWei(2);
      const key = 'UserName1';
      const blockPeriod = 10;
      const referrer = accounts[6];
      const argumentList = [
        WitnessJuryContract.address, FirstTokenContract.address, amount, from, key, blockPeriod, referrer];
      const compiledContract = contracts[contractName];
      deploy(compiledContract, argumentList, from, gas, gasPrice)
        .then((contract: any) => {
          ChallengeContracts.push(contract);
          done();
        });
    });

    it('Should fund challenge', (done) => {
      const from = accounts[3];
      const gas = 250000;
      const amount = toWei(2);
      const value = 0;
      FirstTokenContract.approve(
      ChallengeContracts[0].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[0].fund({ value, from, gas, gasPrice }, (errFund) => {
          expect(errFund).to.equal(null);
          done();
        });
      });
    });

    it('Should fund challenge (and fail, already funded)', (done) => {
      const from = accounts[3];
      const gas = 250000;
      const amount = toWei(2);
      const value = 0;
      FirstTokenContract.approve(
      ChallengeContracts[0].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[0].fund({ value, from, gas, gasPrice }, (errFund) => {
          expect(errFund).not.to.equal(null);
          done();
        });
      });
    });

    it('Should respond to challenge', (done) => {
      const from = accounts[4];
      const gas = 250000;
      const amount = toWei(2);
      const value = 0;
      const key = 'UserName2';
      FirstTokenContract.approve(
      ChallengeContracts[0].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[0].respond(from, key, { value, from, gas, gasPrice }, (errRespond) => {
          expect(errRespond).to.equal(null);
          done();
        });
      });
    });

    it('Should respond to challenge again (and fail, already responded)', (done) => {
      const from = accounts[4];
      const gas = 250000;
      const amount = toWei(2);
      const value = 0;
      const key = 'UserName2';
      FirstTokenContract.approve(
      ChallengeContracts[0].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[0].respond(from, key, { value, from, gas, gasPrice }, (errRespond) => {
          expect(errRespond).not.to.equal(null);
          done();
        });
      });
    });

    it('Should host challenge', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = 'HostUserName';
      ChallengeContracts[0].host(key, { value, from, gas, gasPrice }, (errHost) => {
        expect(errHost).to.equal(null);
        done();
      });
    });

    it('Should host challenge (and fail, already hosted)', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = 'HostUserName';
      ChallengeContracts[0].host(key, { value, from, gas, gasPrice }, (errHost) => {
        expect(errHost).not.to.equal(null);
        done();
      });
    });

    it('Should provide witness key', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = '1234567890';
      ChallengeContracts[0].setWitnessJuryKey(key, { value, from, gas, gasPrice }, (errSetWitnessKey) => {
        expect(errSetWitnessKey).to.equal(null);
        done();
      });
    });

    it('Should provide witness key (and fail, already done)', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = '1234567890';
      ChallengeContracts[0].setWitnessJuryKey(key, { value, from, gas, gasPrice }, (errSetWitnessKey) => {
        expect(errSetWitnessKey).not.to.equal(null);
        done();
      });
    });

    it('Should report as witness (first witness)', (done) => {
      const from = accounts[1];
      const value = 0;
      const gas = 250000;
      const requestNum = 1;
      const answer = 'raw API data';
      const winner = 1;
      WitnessJuryContract.isWitness(
      requestNum, from, (errIsWitness, isWitness) => {
        expect(isWitness).to.equal(true);
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (errReport) => {
          expect(errReport).to.equal(null);
          done();
        });
      });
    });

    it('Should report as witness (and fail, not a witness)', (done) => {
      const from = accounts[5];
      const value = 0;
      const gas = 250000;
      const requestNum = 1;
      const answer = 'raw API data';
      const winner = 1;
      WitnessJuryContract.isWitness(
      requestNum, from, (errIsWitness, isWitness) => {
        expect(isWitness).to.equal(false);
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (errReport) => {
          expect(errReport).not.to.equal(null);
          done();
        });
      });
    });

    it('Should report as witness (second witness)', (done) => {
      const from = accounts[2];
      const value = 0;
      const gas = 250000;
      const requestNum = 1;
      const answer = 'raw API data';
      const winner = 1;
      WitnessJuryContract.isWitness(
      requestNum, from, (errIsWitness, isWitness) => {
        expect(isWitness).to.equal(true);
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (errReport) => {
          expect(errReport).to.equal(null);
          done();
        });
      });
    });

    it('Should resolve the match (and fail, too early)', () => {
      return new Promise(async (resolve, reject) => {
        const from = accounts[2];
        const value = 0;
        const gas = 250000;
        const requestNum = 1;
        const answer = 'raw API data';
        const winner = 1;
        WitnessJuryContract.getRequest(
        requestNum, (errRequest, request) => {
          expect(request[2]).to.equal(from);
          WitnessJuryContract.resolve(requestNum, { value, from, gas, gasPrice }, async (errReport) => {
            expect(errReport).to.not.equal(null);
            resolve();
          });
        });
      });
    });

    it('Should mine blocks', (done) => {
      const from = accounts[5];
      const value = 0;
      const gas = 250000;
      const requestNum = 1;
      const answer = 'raw API data';
      const winner = 1;
      const blockPeriod = 10;
      async.times(blockPeriod, (n, next) => {
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (err, result) => {
          next();
        });
      }, (err, result) => {
        done();
      });
    });

    it('Should resolve the match (second witness)', () => {
      return new Promise(async (resolve, reject) => {
        const from = accounts[2];
        const value = 0;
        const gas = 250000;
        const requestNum = 1;
        const answer = 'raw API data';
        const winner = 1;
        const amount = toWei(2);
        function balanceOf(addr: string): Promise<BigNumber> {
          return new Promise((resolve, reject) => {
            FirstTokenContract.balanceOf(addr, (err, balance) => {
              if (err) {
                reject(err);
              }
              resolve(balance);
            });
          });
        }
        const balanceChallengeBefore = await balanceOf(ChallengeContracts[0].address);
        const balanceWitness1Before = await balanceOf(accounts[1]);
        const balanceWitness2Before = await balanceOf(accounts[2]);
        const balanceWinnerBefore = await balanceOf(accounts[3]);
        const balanceLoserBefore = await balanceOf(accounts[4]);
        const balanceHostBefore = await balanceOf(accounts[5]);
        const balanceReferrerBefore = await balanceOf(accounts[6]);
        const one = new BigNumber(10).pow(18);
        const recentNumRequests = new BigNumber(1);
        const drmVolumeCap = new BigNumber(10000);
        const drmMinFee = new BigNumber(25).times(new BigNumber(10).pow(16));
        const drmMaxFee = new BigNumber(50).times(new BigNumber(10).pow(16));
        const totalFeePercentage = new BigNumber(10).times(new BigNumber(10).pow(16));
        const witnessFeePercentage = recentNumRequests.times(recentNumRequests)
          .times(drmMaxFee.minus(drmMinFee)).divToInt(drmVolumeCap.times(drmVolumeCap))
          .plus(drmMinFee);
        const hostFeePercentage = one.minus(witnessFeePercentage);
        const totalFee = amount.times(2).times(totalFeePercentage).divToInt(one);
        const winnerAmount = amount.times(2).minus(totalFee);
        const witnessJuryAmount = totalFee.times(witnessFeePercentage).divToInt(one);
        const hostAmount = totalFee.minus(witnessJuryAmount);
        WitnessJuryContract.getRequest(
        requestNum, (errRequest, request) => {
          expect(request[2]).to.equal(from);
          WitnessJuryContract.resolve(requestNum, { value, from, gas, gasPrice }, async (errResolve) => {
            const balanceChallengeAfter = await balanceOf(ChallengeContracts[0].address);
            const balanceWitness1After = await balanceOf(accounts[1]);
            const balanceWitness2After = await balanceOf(accounts[2]);
            const balanceWinnerAfter = await balanceOf(accounts[3]);
            const balanceLoserAfter = await balanceOf(accounts[4]);
            const balanceHostAfter = await balanceOf(accounts[5]);
            const balanceReferrerAfter = await balanceOf(accounts[6]);
            expect(errResolve).to.equal(null);
            expect(balanceChallengeBefore.equals(amount.times(2))).to.equal(true);
            expect(balanceChallengeAfter.equals(new BigNumber(0))).to.equal(true);
            expect(balanceLoserAfter.equals(balanceLoserBefore)).to.equal(true);
            expect(balanceWinnerAfter.minus(balanceWinnerBefore).equals(winnerAmount)).to.equal(true);
            expect(balanceHostAfter.minus(balanceHostBefore).equals(hostAmount.divToInt(2))).to.equal(true);
            expect(balanceReferrerAfter.minus(balanceReferrerBefore).equals(hostAmount.divToInt(2))).to.equal(true);
            expect(balanceWitness1After.minus(balanceWitness1Before).equals(witnessJuryAmount.divToInt(2)))
              .to.equal(true);
            expect(balanceWitness2After.minus(balanceWitness2Before).equals(witnessJuryAmount.divToInt(2)))
              .to.equal(true);
            resolve();
          });
        });
      });
    });

  });

  describe('Challenge with jury (contested with more yes votes than no votes)', () => {
    const smallBet = new BigNumber(39);

    it('Should create a new challenge', (done) => {
      const from = accounts[3];
      const gas = 2500000;
      const contractName = 'Challenge';
      const amount = smallBet;
      const key = 'UserName1';
      const blockPeriod = 10;
      const referrer = '0x0';
      const argumentList = [
        WitnessJuryContract.address, FirstTokenContract.address, amount, from, key, blockPeriod, referrer];
      const compiledContract = contracts[contractName];
      deploy(compiledContract, argumentList, from, gas, gasPrice)
        .then((contract: any) => {
          ChallengeContracts.push(contract);
          done();
        });
    });

    it('Should fund challenge', (done) => {
      const from = accounts[3];
      const gas = 250000;
      const amount = smallBet;
      const value = 0;
      FirstTokenContract.approve(
      ChallengeContracts[1].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[1].fund({ value, from, gas, gasPrice }, (errFund) => {
          expect(errFund).to.equal(null);
          done();
        });
      });
    });

    it('Should fund challenge (and fail, already funded)', (done) => {
      const from = accounts[3];
      const gas = 250000;
      const amount = smallBet;
      const value = 0;
      FirstTokenContract.approve(
      ChallengeContracts[1].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[1].fund({ value, from, gas, gasPrice }, (errFund) => {
          expect(errFund).not.to.equal(null);
          done();
        });
      });
    });

    it('Should respond to challenge', (done) => {
      const from = accounts[4];
      const gas = 250000;
      const amount = smallBet;
      const value = 0;
      const key = 'UserName2';
      FirstTokenContract.approve(
      ChallengeContracts[1].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[1].respond(from, key, { value, from, gas, gasPrice }, (errRespond) => {
          expect(errRespond).to.equal(null);
          done();
        });
      });
    });

    it('Should respond to challenge again (and fail, already responded)', (done) => {
      const from = accounts[4];
      const gas = 250000;
      const amount = smallBet;
      const value = 0;
      const key = 'UserName2';
      FirstTokenContract.approve(
      ChallengeContracts[1].address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        ChallengeContracts[1].respond(from, key, { value, from, gas, gasPrice }, (errRespond) => {
          expect(errRespond).not.to.equal(null);
          done();
        });
      });
    });

    it('Should host challenge', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = 'HostUserName';
      ChallengeContracts[1].host(key, { value, from, gas, gasPrice }, (errHost) => {
        expect(errHost).to.equal(null);
        done();
      });
    });

    it('Should host challenge (and fail, already hosted)', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = 'HostUserName';
      ChallengeContracts[1].host(key, { value, from, gas, gasPrice }, (errHost) => {
        expect(errHost).not.to.equal(null);
        done();
      });
    });

    it('Should provide witness key', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = '1234567890';
      ChallengeContracts[1].setWitnessJuryKey(key, { value, from, gas, gasPrice }, (errSetWitnessKey) => {
        expect(errSetWitnessKey).to.equal(null);
        done();
      });
    });

    it('Should provide witness key (and fail, already done)', (done) => {
      const from = accounts[5];
      const gas = 250000;
      const value = 0;
      const key = '1234567890';
      ChallengeContracts[1].setWitnessJuryKey(key, { value, from, gas, gasPrice }, (errSetWitnessKey) => {
        expect(errSetWitnessKey).not.to.equal(null);
        done();
      });
    });

    it('Should report as witness (first witness)', (done) => {
      const from = accounts[1];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const answer = 'raw API data';
      const winner = 1;
      WitnessJuryContract.isWitness(
      requestNum, from, (errIsWitness, isWitness) => {
        expect(isWitness).to.equal(true);
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (errReport) => {
          expect(errReport).to.equal(null);
          done();
        });
      });
    });

    it('Should report as witness (and fail, not a witness)', (done) => {
      const from = accounts[5];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const answer = 'raw API data';
      const winner = 1;
      WitnessJuryContract.isWitness(
      requestNum, from, (errIsWitness, isWitness) => {
        expect(isWitness).to.equal(false);
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (errReport) => {
          expect(errReport).not.to.equal(null);
          done();
        });
      });
    });

    it('Should report as witness (second witness)', (done) => {
      const from = accounts[2];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const answer = 'raw API data';
      const winner = 1;
      WitnessJuryContract.isWitness(
      requestNum, from, (errIsWitness, isWitness) => {
        expect(isWitness).to.equal(true);
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (errReport) => {
          expect(errReport).to.equal(null);
          done();
        });
      });
    });

    it('Should request the jury', (done) => {
      const from = accounts[4];
      const gas = 250000;
      const value = 0;
      ChallengeContracts[1].requestJury({ value, from, gas, gasPrice }, (errRequestJury) => {
        expect(errRequestJury).to.equal(null);
        done();
      });
    });

    it('Should vote in the jury (first juror)', (done) => {
      const from = accounts[1];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const vote = true;
      WitnessJuryContract.juryVote(requestNum, vote, { value, from, gas, gasPrice }, (errReport) => {
        expect(errReport).to.equal(null);
        done();
      });
    });

    it('Should vote in the jury (second juror)', (done) => {
      const from = accounts[2];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const vote = true;
      WitnessJuryContract.juryVote(requestNum, vote, { value, from, gas, gasPrice }, (errReport) => {
        expect(errReport).to.equal(null);
        done();
      });
    });

    it('Should deposit to witness contract (third witness)', (done) => {
      const from = accounts[6];
      const value = 0;
      const gas = 250000;
      const amount = toWei(1);
      FirstTokenContract.approve(WitnessJuryContract.address, amount, { value, from, gas, gasPrice }, (errApprove) => {
        expect(errApprove).to.equal(null);
        WitnessJuryContract.deposit(amount, { value, from, gas, gasPrice }, (errDeposit) => {
          expect(errDeposit).to.equal(null);
          done();
        });
      });
    });

    it('Should vote in the jury (third juror)', (done) => {
      const from = accounts[6];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const vote = true;
      WitnessJuryContract.juryVote(requestNum, vote, { value, from, gas, gasPrice }, (errReport) => {
        expect(errReport).to.equal(null);
        done();
      });
    });

    it('Should resolve the match (and fail, too early)', () => {
      return new Promise(async (resolve, reject) => {
        const from = accounts[2];
        const value = 0;
        const gas = 250000;
        const requestNum = 2;
        const answer = 'raw API data';
        const winner = 1;
        WitnessJuryContract.getRequest(
        requestNum, (errRequest, request) => {
          expect(request[2]).to.equal(from);
          WitnessJuryContract.resolve(requestNum, { value, from, gas, gasPrice }, async (errReport) => {
            expect(errReport).to.not.equal(null);
            resolve();
          });
        });
      });
    });

    it('Should mine blocks', (done) => {
      const from = accounts[5];
      const value = 0;
      const gas = 250000;
      const requestNum = 2;
      const answer = 'raw API data';
      const winner = 1;
      const blockPeriod = 10;
      async.times(blockPeriod, (n, next) => {
        WitnessJuryContract.report(requestNum, answer, winner, { value, from, gas, gasPrice }, (err, result) => {
          next();
        });
      }, (err, result) => {
        done();
      });
    });

    it('Should resolve the match (second witness)', () => {
      return new Promise(async (resolve, reject) => {
        const from = accounts[2];
        const value = 0;
        const gas = 250000;
        const requestNum = 2;
        const answer = 'raw API data';
        const winner = 1;
        const amount = smallBet;
        function balanceOf(addr: string): Promise<BigNumber> {
          return new Promise((resolve, reject) => {
            FirstTokenContract.balanceOf(addr, (err, balance) => {
              if (err) {
                reject(err);
              }
              resolve(balance);
            });
          });
        }
        function witnessBalanceOf(addr: string): Promise<BigNumber> {
          return new Promise((resolve, reject) => {
            WitnessJuryContract.balanceOf(addr, (err, balance) => {
              if (err) {
                reject(err);
              }
              resolve(balance);
            });
          });
        }
        const balanceChallengeBefore = await balanceOf(ChallengeContracts[1].address);
        const balanceWitness1Before = await balanceOf(accounts[1]);
        const balanceWitness2Before = await balanceOf(accounts[2]);
        const balanceWitness3Before = await balanceOf(accounts[6]);
        const balanceWinnerBefore = await balanceOf(accounts[3]);
        const balanceLoserBefore = await balanceOf(accounts[4]);
        const balanceHostBefore = await balanceOf(accounts[5]);
        const witnessJuryBalanceBefore = await balanceOf(WitnessJuryContract.address);
        const witnessJuryBalanceWitness1Before = await witnessBalanceOf(accounts[1]);
        const witnessJuryBalanceWitness2Before = await witnessBalanceOf(accounts[2]);
        const one = new BigNumber(10).pow(18);
        const recentNumRequests = new BigNumber(2);
        const drmVolumeCap = new BigNumber(10000);
        const drmMinFee = new BigNumber(25).times(new BigNumber(10).pow(16));
        const drmMaxFee = new BigNumber(50).times(new BigNumber(10).pow(16));
        const totalFeePercentage = new BigNumber(10).times(new BigNumber(10).pow(16));
        const witnessFeePercentage = recentNumRequests.times(recentNumRequests)
          .times(drmMaxFee.minus(drmMinFee)).divToInt(drmVolumeCap.times(drmVolumeCap))
          .plus(drmMinFee);
        const hostFeePercentage = one.minus(witnessFeePercentage);
        const totalFee = amount.times(2).times(totalFeePercentage).divToInt(one);
        const winnerAmount = amount.times(2).minus(totalFee);
        const witnessJuryAmount = totalFee.times(witnessFeePercentage).divToInt(one);
        const hostAmount = totalFee.minus(witnessJuryAmount);
        const penalty = new BigNumber(50).times(new BigNumber(10).pow(16));
        WitnessJuryContract.getRequest(
        requestNum, (errRequest, request) => {
          expect(request[2]).to.equal(from);
          WitnessJuryContract.resolve(requestNum, { value, from, gas, gasPrice }, async (errResolve) => {
            const balanceChallengeAfter = await balanceOf(ChallengeContracts[1].address);
            const balanceWitness1After = await balanceOf(accounts[1]);
            const balanceWitness2After = await balanceOf(accounts[2]);
            const balanceWitness3After = await balanceOf(accounts[6]);
            const balanceWinnerAfter = await balanceOf(accounts[3]);
            const balanceLoserAfter = await balanceOf(accounts[4]);
            const balanceHostAfter = await balanceOf(accounts[5]);
            const witnessJuryBalanceAfter = await balanceOf(WitnessJuryContract.address);
            const witnessJuryBalanceWitness1After = await witnessBalanceOf(accounts[1]);
            const witnessJuryBalanceWitness2After = await witnessBalanceOf(accounts[2]);
            expect(errResolve).to.equal(null);
            expect(balanceChallengeBefore.equals(amount.times(2))).to.equal(true);
            expect(balanceChallengeAfter.equals(new BigNumber(0))).to.equal(true);
            expect(balanceWinnerAfter.equals(balanceWinnerBefore)).to.equal(true);
            expect(balanceLoserAfter.minus(balanceLoserBefore).equals(winnerAmount)).to.equal(true);
            expect(balanceHostAfter.minus(balanceHostBefore).equals(hostAmount)).to.equal(true);
            expect(balanceWitness1After.minus(balanceWitness1Before)
              .equals(witnessJuryAmount.divToInt(3)
              .plus(witnessJuryBalanceWitness1Before.times(penalty).divToInt(one))))
              .to.equal(true);
            expect(balanceWitness2After.minus(balanceWitness2Before).equals(witnessJuryAmount.divToInt(3)
              .plus(witnessJuryBalanceWitness2Before.times(penalty).divToInt(one))))
              .to.equal(true);
            expect(balanceWitness3After.minus(balanceWitness3Before).equals(witnessJuryAmount.divToInt(3)))
              .to.equal(true);
            expect(witnessJuryBalanceBefore.minus(witnessJuryBalanceAfter)
              .equals(witnessJuryBalanceWitness1Before.plus(witnessJuryBalanceWitness2Before)
              .times(penalty).divToInt(one)))
              .to.equal(true);
            expect(witnessJuryBalanceWitness1Before.minus(witnessJuryBalanceWitness1After)
              .equals(witnessJuryBalanceWitness1Before.times(penalty).divToInt(one)))
              .to.equal(true);
            expect(witnessJuryBalanceWitness2Before.minus(witnessJuryBalanceWitness2After)
              .equals(witnessJuryBalanceWitness2Before.times(penalty).divToInt(one)))
              .to.equal(true);
            resolve();
          });
        });
      });
    });

  });

});
