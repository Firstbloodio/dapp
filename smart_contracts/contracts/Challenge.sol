contract Challenge is SafeMath {

  uint public fee = 10 * (10 ** 16); // fee percentage (100% = 10 ** 18)
  uint public blockPeriod = 6000; // period of blocks for waiting until certain transactions can be sent
  uint public blockNumber; // block number when this challenge was initiated
  bool public funded; // has the initial challenger funded the contract?
  address public witnessJury; // the WitnessJury smart contract
  address public token; // the token of the prize pool
  address public user1; // the initial challenger
  address public user2; // the responding challenger
  string public key1; // something to identify the initial challenger
  string public key2; // something to identify the responding challenger
  uint public amount; // the amount each challenger committed to prize pool
  address public host; // the witness who agreed to host
  string public hostKey; // something to identify the host
  string public witnessJuryKey; // something the host used to identify the challenge specifics
  uint public witnessJuryRequestNum; // the WitnessJury request number (in the WitnessJury smart contract)
  uint public winner; // the winner (1 or 2)
  bool public rescued; // has the contract been rescued?
  bool public juryCalled; // has the jury been called?
  address public referrer; // the referrer of the person who created the challenge (splits reward with host)

  event NewChallenge(uint amount, address user1, string key1);
  event Fund();
  event Respond(address user2, string key2);
  event Host(address host, string hostKey);
  event SetWitnessJuryKey(uint witnessJuryRequestNum, string witnessJuryKey);
  event RequestJury();
  event Resolve(uint winner, bool wasContested, uint winnerAmount, uint hostAmount, uint witnessJuryAmount);
  event Rescue();

  function Challenge(address witnessJury_, address token_, uint amount_, address user1_, string key1_, uint blockPeriod_, address referrer_) public {
    require(amount_ > 0);
    blockPeriod = blockPeriod_;
    witnessJury = witnessJury_;
    token = token_;
    user1 = user1_;
    key1 = key1_;
    amount = amount_;
    referrer = referrer_;
    blockNumber = block.number;
    NewChallenge(amount, user1, key1);
  }

  function fund() public {
    // remember to call approve() on the token first...
    require(!funded);
    require(!rescued);
    require(msg.sender == user1);
    require(Token(token).transferFrom(user1, this, amount));
    funded = true;
    blockNumber = block.number;
    Fund();
  }

  function respond(address user2_, string key2_) public {
    // remember to call approve() on the token first...
    require(user2 == 0x0);
    require(msg.sender == user2_);
    require(funded);
    require(!rescued);
    user2 = user2_;
    key2 = key2_;
    blockNumber = block.number;
    require(Token(token).transferFrom(user2, this, amount));
    Respond(user2, key2);
  }

  function host(string hostKey_) public {
    require(host == 0x0);
    require(!rescued);
    host = msg.sender;
    hostKey = hostKey_;
    blockNumber = block.number;
    Host(host, hostKey);
  }

  function setWitnessJuryKey(string witnessJuryKey_) public {
    require(witnessJuryRequestNum == 0);
    require(msg.sender == host);
    require(!rescued);
    witnessJuryRequestNum = WitnessJury(witnessJury).numRequests() + 1;
    witnessJuryKey = witnessJuryKey_;
    blockNumber = block.number;
    WitnessJury(witnessJury).newRequest(witnessJuryKey, this);
    SetWitnessJuryKey(witnessJuryRequestNum, witnessJuryKey);
  }

  function requestJury() public {
    require(!juryCalled);
    require(msg.sender == user1 || msg.sender == user2);
    require(!rescued);
    require(winner == 0);
    require(WitnessJury(witnessJury).getWinner1(witnessJuryRequestNum) != 0 && WitnessJury(witnessJury).getWinner2(witnessJuryRequestNum) != 0);
    juryCalled = true;
    blockNumber = block.number;
    WitnessJury(witnessJury).juryNeeded(witnessJuryRequestNum);
    RequestJury();
  }

  function resolve(uint witnessJuryRequestNum_, bool juryContested, address[] majorityJurors, uint winner_, address witness1, address witness2, uint witnessJuryRewardPercentage) public {
    require(winner == 0);
    require(witnessJuryRequestNum_ == witnessJuryRequestNum);
    require(msg.sender == witnessJury);
    require(winner_ == 1 || winner_ == 2);
    require(!rescued);
    require(block.number > blockNumber + blockPeriod);
    uint totalFee = safeMul(safeMul(amount, 2), fee) / (1 ether);
    uint winnerAmount = safeSub(safeMul(amount, 2), totalFee);
    uint witnessJuryAmount = safeMul(totalFee, witnessJuryRewardPercentage) / (1 ether);
    uint hostAmount = safeSub(totalFee, witnessJuryAmount);
    uint flipWinner = winner_ == 1 ? 2 : 1;
    winner = juryContested ? flipWinner : winner_;
    if (winnerAmount > 0) {
      require(Token(token).transfer(winner == 1 ? user1 : user2, winnerAmount));
    }
    if (referrer != 0x0 && hostAmount / 2 > 0) {
      require(Token(token).transfer(host, hostAmount / 2));
      require(Token(token).transfer(referrer, hostAmount / 2));
    } else if (referrer == 0 && hostAmount > 0) {
      require(Token(token).transfer(host, hostAmount));
    }
    if (!juryContested && witnessJuryAmount / 2 > 0) {
      require(Token(token).transfer(witness1, witnessJuryAmount / 2));
      require(Token(token).transfer(witness2, witnessJuryAmount / 2));
    } else if (juryContested && witnessJuryAmount / majorityJurors.length > 0) {
      for (uint i = 0; i < majorityJurors.length; i++) {
        require(Token(token).transfer(majorityJurors[i], witnessJuryAmount / majorityJurors.length));
      }
    }
    uint excessBalance = Token(token).balanceOf(this);
    if (excessBalance > 0) {
      require(Token(token).transfer(0x0, excessBalance));
    }
    Resolve(winner, juryContested, winnerAmount, hostAmount, witnessJuryAmount);
  }

  function rescue() public {
    require(!rescued);
    require(funded);
    require(block.number > blockNumber + blockPeriod * 10);
    require(msg.sender == user1 || msg.sender == user2);
    require(winner == 0);
    rescued = true;
    if (user2 != 0x0) {
      require(Token(token).transfer(user1, amount));
      require(Token(token).transfer(user2, amount));
    } else {
      require(Token(token).transfer(user1, amount));
    }
    Rescue();
  }

}
