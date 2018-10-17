# FirstBlood Dapp Concepts Overview

This is a brief overview of the major concepts behind the FirstBlood Dapp.

## Decentralized

 * FirstBlood Dapp is decentralized.
 * The FirstBlood Dapp is downloadable and does not require FirstBlood to run any servers to host any data, software or any other part of the FirstBlood Dapp Platform.
 * The "backend" is entirely encapsulated in Ethereum smart contracts.

## Transactions and private keys

 * Most interactions with the user interface involve sending Ethereum transactions via MetaMask.
 * The user's private key is stored on his own computer, in MetaMask or (if he's a witness) in FirstBlood Dapp itself.
 * No funds are stored in such a way that FirstBlood or anyone other than the user has access to them (assuming the user's computer is secure).

## Challenges and hosts

 * FirstBlood Dapp lets you challenge someone to a game (of Dota2).
 * The first player creates a new Challenge smart contract.
 * Both players fund the smart contract with the desired (equal) amount of 1ST tokens.
 * Another user can volunteer to be a "host" for the game.
 * The host announces his presence to the Challenge smart contract and starts a game lobby, invites the two players, and starts the game.
 * The players finish the game and wait.

## Witnesses

 * Any 1ST token-holder can stake 1ST tokens in the Witness/Jury smart contract.
 * Two witnesses will be randomly selected (proportional to tokens staked).
 * FirstBlood Dapp will automatically enable the two witnesses to check the game API for the result and send it to the blockchain.
 * Once the witnesses have reported the results, the players have 6,000 blocks to dispute the results.
 * If the players do not dispute, the game can be resolved.

## Jury

 * A player may dispute the results reported by the witnesses by clicking the "Request Jury" button on the sidebar of the challenge details page.
 * If either player disputes the first witness's answer, the jury will be engaged.
 * Three jurors will be selected from the Witness/Juror smart contract.
 * The jurors should manually inspect the game results and vote whether to change the winner or not.
 * After the dispute period has ended (6,000 blocks), the game can be resolved.

## Resolving / paying out

 * Anyone can resolve a game.
 * If three jurors voted and the majority voted to overturn the result reported by the witnesses, half of the number of 1ST tokens deposited by each overruled witness will be returned to each of the witnesses’ Ethereum account, making it less likely that such individuals will be selected as witnesses in the future (unless and until the individuals re-deposit the 1ST tokens into the witness pool).
 * The winner gets 90 percent of the prize pool.
 * The remainder of the prize pool (the “Administrative Fee”) is a fee split between the hosts, witnesses, jurors, and/or referrer in the following ways:
   * 25-50 percent is split between either: (a) the witnesses, if the result was uncontested or the jurors vote to let the result stand or (b) the jurors, if the majority voted to change the result reported by the Witnesses. This percentage goes up from 25 to 50 percent as match volume increases.
   * The rest of the Administrative Fee is given to the host (if there is no referrer), or split between the host and the referrer (if the challenge initiator specified a referrer address).

## Rescuing

 * If something goes wrong, the funds in the Challenge smart contract can be rescued.
 * This can be done if:
   * Nobody accepted the challenge.
   * A host never volunteered, or failed to start the game lobby.
   * Witnesses failed to report.
 * Assuming one the above conditions is present, either player can rescue the funds from the challenge details page after 60,000 blocks have passed.

## Reputation, matching, and MMR

 * Reputation is a function of games played plus games witnessed, divided by times the witness was penalized. Specifically, `Reputation = ( (number_of_completed_matches) + (number_of_witness_responses / 10) ) / (number_of_witness_penalties + 1)`.
 * Players can filter games by reputation score to weed out toxic users.
 * Players can choose to be automatically matched against an open challenge with the closest MMR.
 * Every time a user plays a game, MMR is updated.
 * All logs are stored and retrieved from the blockchain, so the user will only see data that his copy of FirstBlood Dapp has been able to download so far (like syncing a bitcoin client).
