# FirstBlood Dapp Frequently Asked Questions

## What is the FirstBlood Dapp?

The FirstBlood® Dapp is a desktop-based decentralized application that runs on smart contracts in the Ethereum blockchain. FirstBlood Dapp allows players to challenge each other in head-to-head competitions involving esport games. Each player in a challenge contributes an equal amount of 1ST tokens (the "challenge allocation"), which is awarded to the winning player based on the result of the game in which they are playing.

## What games can I play on the FirstBlood Dapp?

In the beta version, you can only play Dota 2<sup>1</sup> in solo mode.  We anticipate, but we cannot be certain, that in future versions of the FirstBlood Dapp, you will be able to play in multiplayer, team mode, and additional esport games will be available.

## What are the different roles that people play?

  *	Player - A player is someone who challenges others or responds to others' challenges to play a game – and then plays the game.
  *	Host - A host is someone who volunteers to start the Dota 2 game lobby for two players in a challenge.
  *	Witness - A witness is someone who asks to be in the witness pool and is randomly selected from the witness pool to automatically check the result of a Dota 2 game and report the result.  
  *	Juror - A juror is someone who is randomly selected, at the request of either player, to inspect the witness' results and determine if the results should stand or not.
  *	Referrer - A referrer is someone who tells a new user about the FirstBlood Dapp. If the new user enters the referrer's Ethereum address when logging in, the referrer will earn a portion of the fees every time the new user initiates a challenge, when the challenge is finished. There are no limits on the number of times someone can be named as someone else's referrer. You can, technically, be your own referrer.

## What do I need before I can begin to play?

  *	Ethereum account - You can either create a new Ethereum account through MetaMask inside the FirstBlood Dapp or import an existing account.
  *	1ST tokens – Currently, you must acquire 1ST tokens in order to play games. You should also have some Ether in your Ethereum account to pay for Gas Fees (as defined below) when you send transactions through the FirstBlood Dapp.
  * A copy of the FirstBlood Dapp running on your computer. The Windows or Mac installer can be downloaded from the "Releases" tab of the FirstBlood Dapp GitHub page, or you can build the app from the source code.
  * Steam username - You will need a Steam username to use as your identity when using the FirstBlood Dapp as a Dota 2 player. The Steam username should be publicly viewable from `https://steamcommunity.com/id/USERNAME/` (see https://support.steampowered.com/kb_article.php?ref=4113-YUDH-6401 for details).

## What is a 1ST token and how do I get it?

A 1ST token is an Ethereum-based ERC-20 token that powers the FirstBlood Dapp. In particular, 1ST token is the token that players contribute as the challenge allocation when competing against another player in a competition. It is also the token that incentivizes the witness and jury system. You need to acquire it on your own outside of the FirstBlood Dapp.  Any financial transactions that you engage in through the FirstBlood Dapp will be conducted solely through the Ethereum network. We have no insight into or control over these transactions, nor do we have the ability to reverse any transactions.

## If I don't want to challenge other players for 1ST tokens, can I still play?

Yes, you can start a challenge by setting the challenge allocation at 0 1ST tokens. If someone accepts your challenge, you will play without paying a challenge allocation.

## What software license governs the use of the FirstBlood Dapp?

The FirstBlood Dapp is open source software governed by the MIT software license providing you broad rights to use and modify the software.  The FirstBlood Dapp is an application that allows players to challenge one another in connection with esport games, initially only Dota 2. Your use of any esport game is governed not by the MIT license but by the subscription agreement, terms of service, privacy policy or other documents selected and identified by the publisher of such game (the "esport Game Terms").  FirstBlood assumes no responsibility for the esport game.  Please review the esport Game Terms before playing any such game in connection with the FirstBlood Dapp and make an independent determination on whether the esport Game Terms are acceptable.  If they are not, please do not play the game in connection with the FirstBlood Dapp.

## How do I challenge someone to a game?

In the FirstBlood Dapp, click on the "Play" tab. Then enter the amount of 1ST tokens you want to set as the challenge allocation, and press the "Create Challenge" button. MetaMask will appear three times, and you should approve each transaction. The first one creates a new smart contract, the second one approves the smart contract to move the 1ST tokens on your behalf, and the third one moves the 1ST tokens.

## What are the advantages of initiating or accepting a challenge?

Benefits of initiating a challenge:
 * You get to set the exact amount of 1ST tokens you want as the challenge allocation.
 * You don't have to worry about someone else sending a transaction to join a challenge at the same time you do, and beating you to the punch (costing you an Ethereum Gas Fee for nothing).
 * You don't have to worry as much about joining a challenge and having your opponent fail to show up.

Benefits of accepting a challenge:
 * You get to determine who you want to play against.
 * You pay less Ethereum Gas Fees, since you don't have to pay for creating the smart contract.

## If someone accepts my challenge, can I later say I don't want to play that person?

No. Once someone accepts your challenge, you cannot request a new opponent.

## How do I become a host?

In order to be a host, you must log into the FirstBlood Dapp with a witness account (fill out the bottom part of the login form). Find a challenge in the list that is "ongoing" and click on it. If a host hasn't joined yet, you will see that it is "awaiting host." Click the "Become A Host" button at the top of the screen and the FirstBlood Dapp will handle the rest automatically.  Hosts are selected on a first come, first served basis.  You may act as a host of a game in which you are a player if you have multiple Steam usernames and use a different Steam username than you are using as a player.  

# How do I become a witness?

Log into the FirstBlood Dapp with a witness account (fill out the bottom part of the login form). Click on the "Witness" tab and use the "Deposit" button to deposit 1ST tokens into the Witness/Jury smart contract. Once you have done so, leave the FirstBlood Dapp running on your computer, and you will be randomly selected (proportional to the amount of 1ST tokens you have deposited) periodically to witness results. This is an automatic, hands-free process.

If your tokens represent X% of the witness pool, and Y challenges need witnesses, then you are likely to be selected as a witness approximately X * Y / 100 * 2 times, since two witnesses are needed for each challenge. Note that an average of two witnesses are selected for each challenge (as opposed to exactly two). If more than two witnesses are selected, then only the first two to respond will be counted. There is also a limit on the proportion of the witness pool each witness can hold, which is 1%. If you have more than 1% of the witness pool at the time that you respond as a witness, the excess above 1% will be automatically removed from the witness pool and refunded to your Ethereum account. The 1% limit will start applying when there are more than 100 witnesses in the witness pool.

If three jurors voted and the majority voted to overturn the result reported by the witnesses, half of the number of 1ST tokens deposited by each witness in the witness pool will be returned to each witnesses’ Ethereum account making it less likely that such individuals will be selected as witnesses in the future (unless and until the individuals re-deposit the 1ST tokens into the witness pool).

You may withdraw your 1ST tokens from the witness pool at any time by clicking the "Withdraw" button within the FirstBlood Dapp.

## How do I become a juror?

Log into the FirstBlood Dapp with a witness account (fill out the bottom part of the login form). Click on the "Witness" tab and use the "Deposit" button to deposit 1ST tokens into the Witness/Jury smart contract. Once you have done so, you will be randomly selected proportional to the amount of 1ST tokens you have deposited. The jury process is not automatic, so you will have to click on the jury jobs as they appear and review what the witnesses reported. If you agree with the results the first witness reported, press the green thumbs up button, otherwise press the red thumbs down button. Three jurors are selected when the jury is called upon. Jurors should, at a minimum, click on the witness transactions and look at the transactions on Etherscan. The transactions on Etherscan will show the API data that each of the witnesses looked at to determine the winner. If the data looks wrong for some reason (e.g., doesn't match the reported winner, game too short, API data is missing), consider changing the result.

## How do I refer a friend and receive 1ST tokens?

Tell your friend to download the FirstBlood Dapp and enter your Ethereum address when he or she logs in. Every time your friend initiates a challenge, identifies you as the referrer and plays through to completion, you will earn a portion of the Administrative Fee (as defined below).

## How can I refer my friends?

You can use your own social channels to refer your friends to the FirstBlood Dapp. Remember to share your Ethereum address with your friends so they can add you as a referrer when they log in.

## Is there a limit on the size of any challenge allocation?

No, there is no limit.

## When I win a challenge, how many 1ST tokens do I get?

When you win a challenge, 90% of the total prize pool (the sum of the challenge allocations paid for that challenge) goes to you. The remainder of the prize pool (the "Administrative Fee") is a fee split between the hosts, witnesses, jurors, and/or referrer in the following ways:
 * 25-50 percent is split between either: (a) the witnesses, if the result was uncontested or the jurors vote to let the result stand or (b) the jurors, if the majority voted to change the result reported by the Witnesses. This percentage goes up from 25 to 50 percent as match volume increases.
 * The rest of the Administrative Fee is given to the host (if there is no referrer), or split between the host and the referrer (if the challenge initiator specified a referrer address).

## When do I get my winnings?

Once the witnesses have reported the result, the players have 6,000 Ethereum blocks to contest the result recorded by the witnesses (as of October 17, 2018, it takes approximately 23 hours for 6000 Ethereum blocks to be recorded). If nobody contests, the prize can be paid out. If someone contests, the jurors have 6,000 Ethereum blocks from when the result was contested to vote on whether to change the result. If the jurors sustain the witnesses report of the results, or otherwise do not act (i.e., all three do not vote), the report of the witnesses will stand. If by a majority, the jurors, overrule the report of the witnesses, the result will be determined by the majority of the jurors.  Once the jurors have had 6,000 blocks to vote, the prize can be paid out. Anyone can trigger the payout transaction by clicking the "Payout Funds" button in the FirstBlood Dapp. This triggers a single transaction that will automatically and instantly pay all the necessary parties when the transaction is confirmed in the blockchain. If nobody ever clicks the "Payout Funds" button, then the funds will remain in the smart contract, and nobody will get paid (players, witnesses, jurors, referrers).  There is no time limit on when the Payout Funds button may be clicked.

## Does FirstBlood collect any fees?

FirstBlood does not take any portion of the 10% Administrative Fee and does not receive any gas associated with Ethereum transactions. In the future, we anticipate releasing a centralized version of the Dapp in which challenges for games of skill will use a fiat currency.  In this centralized version we anticipate collecting a fee.

## I understand that the FirstBlood Dapp is on the Ethereum blockchain. Will I pay any fees in connection with the use of the Ethereum network?

Ethereum requires the payment of a transaction fee (a "Gas Fee") for every transaction that occurs on the Ethereum network. The Gas Fee funds the network of computers that run the decentralized Ethereum network, including the payment of fees to miners who record transactions on the blockchain. This means that you will need to pay a Gas Fee for each transaction that occurs via the Dapp. To be clear, the Gas Fee is entirely separate from the Administrative Fee in 1ST tokens that is paid to witnesses, jurors, hosts and referrers.

## How are the outcome of the games decided?

Two witnesses (on average) are selected to check the result of every game and submit the result to the blockchain. The first witness is the official result, and the second is for confirmation.  See also How do I get my winnings?

## If there is a dispute about who won a challenge, how is it resolved?

If either player disagrees with the official result, he or she can contest the result by requesting a jury. Either player can request a jury by clicking the "Request Jury" button on the sidebar of the challenge details page. This button will be available after the witnesses have both reported, and will remain during the 6,000 block period players have to dispute results. Three jurors (on average) will be selected. If all three jurors vote and the majority vote to overturn the result, the result will be changed. Otherwise, the result will stand. This result is final and cannot be changed.  See also How do I get my winnings?

## Once I send my 1ST tokens to the smart contract(s), can I get them back?

For 1ST tokens you have sent as a challenge allocation to a smart contract, the only way you can get your challenge allocation back (besides winning) is if the match fails for any of the following reasons:
 * Nobody accepted the challenge.
 * A host never volunteered, or failed to start the game lobby.
 * 2 witnesses failed to report before 6000 blocks are added to the blockchain after the completion of the challenge.

If any of these failure cases is true, after 60,000 blocks have been added to the blockchain, a "Rescue Funds" button will appear, which either player can press to trigger a transaction that will return each player's funds.

1ST tokens you have deposited into the Witness/Jury pool can be withdrawn at any time.

##What if the smart contracts did not accurately reflect the FAQs?

FirstBlood has worked diligently to ensure that the smart contracts accurately reflect what we have stated in these FAQs and other documents on GitHub regarding how the FirstBlood Dapp Platform works.  We have even engaged a third party to review the codebase related to the smart contracts to confirm that the smart contracts do what they are supposed to do.  We encourage you to read the [FirstBlood Dapp Smart Contract Code Audit](FirstBloodContractAuditReportv3.2.pdf).  If, however, the smart contracts do not accurately reflect what is stated by FirstBlood on GitHub, the activities initiated by the smart contracts, including the payment of the challenge allocation, are not reversible. You assume all losses associated with, and all damages you suffer in connection with, your use of the FirstBlood Dapp Platform, including any accidental, inadvertent or other unexpected loss of 1ST tokens. See the [FirstBlood Dapp Disclaimers](disclaimers.md) for more information.

## What happens with the information I provide when using the FirstBlood Dapp?

When you are using the FirstBlood Dapp, including as a player, witness, or juror, you may be required to provide your esport game username and password (e.g., your Steam username and password), your private Ethereum account key, and, if naming a referrer, the referrer’s Ethereum account.

All of this information, as well as activities collected by the Dapp (e.g., challenges initiated; challenges played, witnessed, or juried; challenges won or lost; the amount of the challenge allocation) are all recorded in the blockchain (and therefore can be viewed and used by virtually anyone); except that: (a) the esport Game password is made available to only the applicable esport game (e.g., Steam) and (b) the private key for your Ethereum account is stored locally on the Dapp and converted to your public key, which is published to the blockchain.  In addition, any information made available or collected by the esport game publisher or the MetaMask browser extension can be used by them, presumably in the manner described in their respective privacy policies.

As noted above, the FirstBlood Dapp is decentralized and is resident on your device and not hosted by FirstBlood in the cloud.  Accordingly, FirstBlood does not have access to any information collected by or through the Dapp other than information that is publicly available (e.g., information that is recorded In blockchain.)

## What is a reputation score?

Reputation is a function of games played plus games witnessed, divided by times the witness was penalized. Specifically, `Reputation = ((number_of_completed_matches) + (number_of_witness_responses / 10)) / (number_of_witness_penalties + 1)`. Click any player to see his or her reputation score. You can also filter the game list by reputation score.

Reputation score is a feedback mechanism to indicate which players are contributing in a positive way by playing games and witnessing matches without being penalized by the jury. The general idea is that if you are thinking about accepting a challenge, you may want to pick someone with a high reputation score, because this indicates that the person is more likely to be a committed player who isn't trying to cheat the system.  Of course, players with higher reputation scores may also be more skilled players, making challenges more . . . challenging.

## Can I make changes to the FirstBlood Dapp?

You are welcome to make modifications to the source code and submit pull requests -- or fork the FirstBlood Dapp.

## If I'm having technical issues with the FirstBlood Dapp, will FirstBlood provide technical support?

You can submit technical issues to the "Issues" tab on GitHub. FirstBlood staff may monitor and respond to issues posted here. Other community members may also respond.

## If I'm having technical issues with the FirstBlood Dapp, can I fix the bug?

Sure! FirstBlood Dapp is open source made available under the MIT license. You're welcome to fix the bug and submit a pull request.

What do you mean when you say FirstBlood Dapp is a decentralized Dapp?

We mean that the FirstBlood Dapp and network is self-sufficient and does not require FirstBlood to support it.

FirstBlood publishes a landing page on GitHub, including a download link to the user interface executable, hosted on GitHub.
The FirstBlood Dapp is downloadable and does not require FirstBlood to run any servers.
The "backend" is entirely encapsulated in smart contracts that FirstBlood wrote and that the FirstBlood Dapp deploys to the Ethereum blockchain.
The FirstBlood Dapp is made available under a permissive open source license and may be modified to fix bugs or to change the functionality by FirstBlood users.
The only "centralized" servers the FirstBlood Dapp connects to are game APIs that are controlled by the esport game publisher and FirstBlood does not control (e.g., the Dota 2 API).
Your private key is stored on your computer in MetaMask, or if you are a witness, in the FirstBlood Dapp that is downloaded on your computer.
Assuming your computer is secure, no funds are stored in such a way that anyone other than you has access to them.
## Does FirstBlood have any control over the outcome of the games?

FirstBlood does not have any control over the outcome of the games. The outcome depends entirely on the skill of the players and the witnesses and/or jury.

## If I'm playing in a competition through the FirstBlood Dapp and have either set or accepted a challenge allocation that requires 1ST tokens, am I violating gambling laws?

The laws related to gambling and skill-based competitions vary greatly based on the particular jurisdiction. It is incumbent on you to be familiar with the rules and laws related to your particular jurisdiction and only participate in competitions where it is legal to do so.  We view the activity enabled through the FirstBlood (decentralized) App (in particular, those based on the Dota 2 game) to be skill-based competitions. Accordingly, those utilizing the FirstBlood App in locations where skill-based competitions involving a prize and consideration are permitted are not likely to be violating any existing gambling laws.  However, users may not rely on this general view but must examine their own circumstances in the context of the rules and laws of their specific jurisdiction.

## How can I learn even more about the FirstBlood Dapp Platform?

Additional information about the FirstBlood Dapp Platform is available on GitHub including the following:

 * [FirstBlood Dapp Installation guide](../dapp/README.md)
 * [FirstBlood Dapp Concepts Overview](concepts.md)
 * [FirstBlood Dapp Tutorial](tutorial.md)
 * [FirstBlood Dapp Smart Contract Code Audit](FirstBloodContractAuditReportv3.2.pdf)
 * [FirstBlood Dapp Disclaimers](disclaimers.md)

<sup>1</sup>A note about trademarks: FirstBlood® is a registered trademark of FirstBlood Technologies, Inc.  Dota 2 is a registered trademark or trademark of the Valve Corporation.  FirstBlood is not affiliated with or endorsed by the Valve Corporation.
