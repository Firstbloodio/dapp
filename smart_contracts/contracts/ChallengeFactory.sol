contract ChallengeFactory is SafeMath {

  address witnessJury;
  address token;

  mapping(uint => Challenge) public challenges;
  uint numChallenges;

  event NewChallenge(address addr, uint amount, address user, string key);

  function ChallengeFactory(address witnessJury_, address token_) public {
    witnessJury = witnessJury_;
    token = token_;
  }

  function newChallenge(uint amount, address user, string key, address referrer) public {
    numChallenges = safeAdd(numChallenges, 1);
    uint blockPeriod = 6000;
    challenges[numChallenges] = new Challenge(witnessJury, token, amount, user, key, blockPeriod, referrer);
    NewChallenge(address(challenges[numChallenges]), amount, user, key);
  }

}
