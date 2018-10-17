contract WitnessJury is SafeMath {
  mapping(address => uint) public balances; // mapping of witness address to witness balance
  uint public limit = 10 ** 16; // 1% = the max percentage of the overall witness pool one person can have
  uint public numWitnessesBeforeLimit = 100; // the number of witnesses before the limit starts kicking in
  uint public totalBalance; // the total of all witness balances
  uint public numWitnesses; // count of total witnesses with non-zero balances
  uint public blockPeriod = 6000; // 1 day at 14.4 seconds per block
  uint public desiredWitnesses = 2; // desired number of witnesses to fulfill a request (witness a match)
  uint public desiredJurors = 3; // desired number of jurors
  uint public penalty = 50 * (10 ** 16); // penalty for witnesses if jury votes yes (penalty is sent back to the witnesses)
  address public token; // the token being staked by witnesses
  mapping(uint => Request) public requests; // mapping of requests that are partially or completely filled
  uint public numRequests; // count of total number of partially or completely filled requests
  mapping(uint => uint) public requestsPerBlockGroup; // map of number of requests per block group
  uint public drmVolumeCap = 10000; // after this many matches per block group, fee stops increasing
  uint public drmMinFee = 25 * (10 ** 16); // minimum witness reward percentage (100% = 10 ** 18)
  uint public drmMaxFee = 50 * (10 ** 16); // maximum witness reward percentage (100% = 10 ** 18)
  mapping(uint => bool) public juryNeeded; // mapping of requestNum to whether the jury is needed
  mapping(uint => mapping(address => bool)) public juryVoted; // mapping of requestNum to juror addresses who already voted
  mapping(uint => uint) public juryYesCount; // mapping of requestNum to number of yes votes
  mapping(uint => uint) public juryNoCount; // mapping of requestNum to number of no votes
  mapping(uint => address[]) public juryYesVoters; // mapping of requestNum to array of yes voters
  mapping(uint => address[]) public juryNoVoters; // mapping of requestNum to array of no voters

  struct Request {
    string key; // the key, which should contain details about the request (for example, match ID)
    address witness1; // the first witness
    address witness2; // the second witness
    string answer1; // the first witness' answer
    string answer2; // the second witness' answer
    uint winner1; // the first witness' winner
    uint winner2; // the second witness' winner
    uint fee; // percentage of match fee that will go to witness / jury pool (100% = 10 ** 18)
    address challenge; // challenge smart contract
    uint blockNumber; // block number when request was made
  }

  event Deposit(uint amount);
  event Withdraw(uint amount);
  event ReduceToLimit(address witness, uint amount);
  event Report(uint requestNum, string answer, uint winner);
  event NewRequest(uint requestNum, string key);
  event JuryNeeded(uint requestNum);
  event JuryVote(uint requestNum, address juror, bool vote);
  event Resolve(uint requestNum);
  event JuryContested(uint requestNum);

  function WitnessJury(address token_) public {
    token = token_;
  }

  function balanceOf(address user) public constant returns(uint) {
    return balances[user];
  }

  function reduceToLimit(address witness) public {
    require(witness == msg.sender);
    uint amount = balances[witness];
    uint limitAmount = safeMul(totalBalance, limit) / (1 ether);
    if (amount > limitAmount && numWitnesses > numWitnessesBeforeLimit) {
      uint excess = safeSub(amount, limitAmount);
      balances[witness] = safeSub(amount, excess);
      totalBalance = safeSub(totalBalance, excess);
      require(Token(token).transfer(witness, excess));
      ReduceToLimit(witness, excess);
    }
  }

  function deposit(uint amount) public {
    // remember to call approve() on the token first...
    require(amount > 0);
    if (balances[msg.sender] == 0) {
      numWitnesses = safeAdd(numWitnesses, 1);
    }
    balances[msg.sender] = safeAdd(balances[msg.sender], amount);
    totalBalance = safeAdd(totalBalance, amount);
    require(Token(token).transferFrom(msg.sender, this, amount));
    Deposit(amount);
  }

  function withdraw(uint amount) public {
    require(amount > 0);
    require(amount <= balances[msg.sender]);
    balances[msg.sender] = safeSub(balances[msg.sender], amount);
    totalBalance = safeSub(totalBalance, amount);
    if (balances[msg.sender] == 0) {
      numWitnesses = safeSub(numWitnesses, 1);
    }
    require(Token(token).transfer(msg.sender, amount));
    Withdraw(amount);
  }

  function isWitness(uint requestNum, address witness) public constant returns(bool) {
    //random number from 0-999999999
    bytes32 hash = sha256(this, requestNum, requests[requestNum].key);
    uint rand = uint(sha256(requestNum, hash, witness)) % 1000000000;
    return (
      rand * totalBalance < 1000000000 * desiredWitnesses * balances[witness] ||
      block.number > requests[requestNum].blockNumber + blockPeriod
    );
  }

  function isJuror(uint requestNum, address juror) public constant returns(bool) {
    //random number from 0-999999999
    bytes32 hash = sha256(1, this, requestNum, requests[requestNum].key);
    uint rand = uint(sha256(requestNum, hash, juror)) % 1000000000;
    return (
      rand * totalBalance < 1000000000 * desiredWitnesses * balances[juror]
    );
  }

  function newRequest(string key, address challenge) public {
    numRequests = safeAdd(numRequests, 1);
    require(requests[numRequests].challenge == 0x0);
    requests[numRequests].blockNumber = block.number;
    requests[numRequests].challenge = challenge;
    requests[numRequests].key = key;
    requestsPerBlockGroup[block.number / blockPeriod] = safeAdd(requestsPerBlockGroup[block.number / blockPeriod], 1);
    uint recentNumRequests = requestsPerBlockGroup[block.number / blockPeriod];
    if (recentNumRequests < drmVolumeCap) {
      requests[numRequests].fee = safeAdd(safeMul(safeMul(recentNumRequests, recentNumRequests), safeSub(drmMaxFee, drmMinFee)) / safeMul(drmVolumeCap, drmVolumeCap), drmMinFee);
    } else {
      requests[numRequests].fee = drmMaxFee;
    }
    NewRequest(numRequests, key);
  }

  function report(uint requestNum, string answer, uint winner) public {
    require(requests[requestNum].challenge != 0x0);
    require(requests[requestNum].witness1 == 0x0 || requests[requestNum].witness2 == 0x0);
    require(requests[requestNum].witness1 != msg.sender);
    require(isWitness(requestNum, msg.sender));
    reportLogic(requestNum, answer, winner);
    Report(requestNum, answer, winner);
  }

  function reportLogic(uint requestNum, string answer, uint winner) private {
    reduceToLimit(msg.sender);
    if (requests[requestNum].witness1 == 0x0) {
      requests[requestNum].witness1 = msg.sender;
      requests[requestNum].answer1 = answer;
      requests[requestNum].winner1 = winner;
    } else if (requests[requestNum].witness2 == 0x0) {
      requests[requestNum].witness2 = msg.sender;
      requests[requestNum].answer2 = answer;
      requests[requestNum].winner2 = winner;
    }
  }

  function juryNeeded(uint requestNum) public {
    require(msg.sender == requests[requestNum].challenge);
    require(!juryNeeded[requestNum]);
    juryNeeded[requestNum] = true;
    JuryNeeded(requestNum);
  }

  function juryVote(uint requestNum, bool vote) public {
    require(!juryVoted[requestNum][msg.sender]);
    require(juryNeeded[requestNum]);
    require(safeAdd(juryYesCount[requestNum], juryNoCount[requestNum]) < desiredJurors);
    require(isJuror(requestNum, msg.sender));
    juryVoted[requestNum][msg.sender] = true;
    if (vote) {
      juryYesCount[requestNum] = safeAdd(juryYesCount[requestNum], 1);
      juryYesVoters[requestNum].push(msg.sender);
    } else {
      juryNoCount[requestNum] = safeAdd(juryNoCount[requestNum], 1);
      juryNoVoters[requestNum].push(msg.sender);
    }
    JuryVote(requestNum, msg.sender, vote);
  }

  function resolve(uint requestNum) public {
    bool juryContested = juryYesCount[requestNum] > juryNoCount[requestNum] && safeAdd(juryYesCount[requestNum], juryNoCount[requestNum]) == desiredJurors;
    Challenge(requests[requestNum].challenge).resolve(
      requestNum,
      juryContested,
      juryYesCount[requestNum] > juryNoCount[requestNum] ? juryYesVoters[requestNum] : juryNoVoters[requestNum],
      requests[requestNum].winner1,
      requests[requestNum].witness1,
      requests[requestNum].witness2,
      requests[requestNum].fee
    );
    if (juryContested) {
      uint penalty1 = safeMul(balances[requests[requestNum].witness1], penalty) / (1 ether);
      uint penalty2 = safeMul(balances[requests[requestNum].witness2], penalty) / (1 ether);
      balances[requests[requestNum].witness1] = safeSub(balances[requests[requestNum].witness1], penalty1);
      balances[requests[requestNum].witness2] = safeSub(balances[requests[requestNum].witness2], penalty2);
      require(Token(token).transfer(requests[requestNum].witness1, penalty1));
      require(Token(token).transfer(requests[requestNum].witness2, penalty2));
      JuryContested(requestNum);
    }
    Resolve(requestNum);
  }

  function getWinner1(uint requestNum) public constant returns(uint) {
    return requests[requestNum].winner1;
  }

  function getWinner2(uint requestNum) public constant returns(uint) {
    return requests[requestNum].winner2;
  }

  function getRequest(uint requestNum) public constant returns(string, address, address, string, string, uint, address) {
    return (requests[requestNum].key,
            requests[requestNum].witness1,
            requests[requestNum].witness2,
            requests[requestNum].answer1,
            requests[requestNum].answer2,
            requests[requestNum].fee,
            requests[requestNum].challenge);
  }
}
