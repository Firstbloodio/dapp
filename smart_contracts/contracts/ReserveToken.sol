contract ReserveToken is StandardToken, SafeMath {
  string public name;
  string public symbol;
  uint public decimals = 18;
  address public minter;

  event Create(address account, uint amount);
  event Destroy(address account, uint amount);

  function ReserveToken(string name_, string symbol_) public {
    name = name_;
    symbol = symbol_;
    minter = msg.sender;
  }

  function create(address account, uint amount) public {
    require(msg.sender == minter);
    balances[account] = safeAdd(balances[account], amount);
    totalSupply = safeAdd(totalSupply, amount);
    Create(account, amount);
  }

  function destroy(address account, uint amount) public {
    require(msg.sender == minter);
    require(balances[account] >= amount);
    balances[account] = safeSub(balances[account], amount);
    totalSupply = safeSub(totalSupply, amount);
    Destroy(account, amount);
  }
}
