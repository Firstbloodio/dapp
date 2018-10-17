# FirstBlood Dapp Tutorial

This is a tutorial about how to use the FirstBlood Dapp.

## Logging in

![Screenshot](screenshots/login.png)

The first time you open the FirstBlood Dapp, you will need to log in.

If you are interested in playing games, you need to fill out the first section with your public Steam username (the *username* part of http://steamcommunity.com/id/*username*/). In order for this to work, your Steam Community page must be public. You may also, optionally, enter the Ethereum address of someone who referred you to the FirstBlood Dapp.

If you are interested in being a witness and juror, you need to fill out the bottom section with a private key and a public Steam username and password. The Ethereum and Steam accounts you use as a witness should be different from accounts you use to play games on FirstBlood Dapp. Additionally, you should use an Ethereum account that you don't use for anything else, as this Ethereum account will be used to automatically send transactions for you as a witness.

The rest of the tutorial will assume you have logged in as both a player and a witness.

## Games screen

![Screenshot](screenshots/games.png)

Once you are logged in, you will see the "Games" screen. This shows recent games (including open, in progress, and finished challenges), as well as a leaderboard.
The games can be filtered by reputation.

## Play screen

![Screenshot](screenshots/play.png)

The "Play" screen shows the list of games again, but focuses on open challenges.

## MetaMask

![Screenshot](screenshots/metamask.png)

If it's your first time using FirstBlood Dapp, you should configure MetaMask. Your MetaMask account will be used for interacting with FirstBlood Dapp as a player. Click "Open MetaMask."

![Screenshot](screenshots/metamask_account_menu.png)

The first time you open MetaMask, it will take you through a setup process. Once you have gone through this process, you can either use the account MetaMask created for you, or you can import an existing account. To do this, open the account menu in the upper right, and choose "Import Account."

![Screenshot](screenshots/metamask_import_account.png)

Enter your existing account's private key, and click "Import."

![Screenshot](screenshots/metamask_add_token.png)

If you'd like to see your 1ST token balance in MetaMask, click the "Tokens" tab, and click "Add token."

![Screenshot](screenshots/metamask_add_token_form.png)

Enter the 1ST token address, and press "Add." The 1ST token address is 0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7.

![Screenshot](screenshots/metamask_token_balance.png)

Now you can see your 1ST token balance in MetaMask.

## Creating a new challenge

![Screenshot](screenshots/new_challenge.png)

To create a new challenge, go to the "Play" screen, enter an amount (in 1ST) you'd like to play with, and click "Create Challenge."

![Screenshot](screenshots/new_challenge_metamask.png)

MetaMask will ask for your approval to send three separate transaction. You should approve all of them. The first creates a new smart contract, the second approves the smart contract to move tokens on your behalf, and the third moves the tokens.

![Screenshot](screenshots/new_challenge_processing.png)

While a transaction is processing, you will be asked to wait.

![Screenshot](screenshots/new_challenge_appears.png)

Once your transactions have confirmed in the blockchain, your new challenge will appear in the list.

![Screenshot](screenshots/new_challenge_details.png)

Click the challenge to see the challenge details page.

## Accepting a challenge

![Screenshot](screenshots/join_challenge.png)

If you would like to accept another user's challenge, simply press "Accept Challenge."

![Screenshot](screenshots/join_challenge_metamask.png)

MetaMask will appear two times, and you should approve both transactions. The first transaction approves the smart contract to move tokens on your behalf, and the second moves the tokens.

![Screenshot](screenshots/join_challenge_awaiting_host.png)

Once your transactions have confirmed in the blockchain, the challenge details page will update.

## Being a host

![Screenshot](screenshots/become_host.png)

Once two players have joined a challenge together, the challenge will be "Awaiting host." If you logged in as a witness, you can click "Become A Host" to host the game automatically.

![Screenshot](screenshots/become_host_processing.png)

While the FirstBlood Dapp is automatically hosting the game and sending the necessary transactions from your witness account, you will be asked to wait.

![Screenshot](screenshots/waiting_for_host_invite.png)

Each player will get an invite from the host.

![Screenshot](screenshots/waiting_for_host_lobby.png)

The players will be asked to join the correct teams. Once they have done so, the game will start automatically.

## Automatic matching

![Screenshot](screenshots/find_match.png)

If you want to be automatically matched against someone with a similar MMR, press "Find A Match."

![Screenshot](screenshots/find_match_found.png)

The challenge details page will appear. From here, you can click "Accept Challenge."

![Screenshot](screenshots/find_match_found_metamask.png)

From this point, the process is the same as if you were accepting any other challenge. MetaMask will appear three times.

![Screenshot](screenshots/find_match_found_processing.png)

While a transaction is processing, you will be asked to wait.

![Screenshot](screenshots/find_match_found_done.png)

Once your transactions have confirmed in the blockchain, the challenge details page will update.

## Being a witness

![Screenshot](screenshots/witness.png)

From the "Witness" page, you can deposit or withdraw from the Witness/Jury smart contract.

![Screenshot](screenshots/witness_deposit.png)

Enter an amount (of 1ST tokens) you would like to deposit and press "Deposit."

![Screenshot](screenshots/witness_deposit_processing.png)

While the transaction is processing, you will be asked to wait.

![Screenshot](screenshots/witness_deposit_successful.png)

Once the transaction has confirmed in the blockchain, your balance will update.

![Screenshot](screenshots/witness_pending.png)

Witness jobs will appear as you are randomly selected. Here one, is finished, and one is pending.

![Screenshot](screenshots/witness_pending_finished.png)

The pending job will be handled automatically in the background. When it is done, the status will change to finished.

![Screenshot](screenshots/witness_details.png)

Click the witness job to see more details.

![Screenshot](screenshots/etherscan.png)

From the match details page, click any status to see the associated Ethereum transaction on Etherscan.

## Requesting a jury

![Screenshot](screenshots/jury_duty_vote.png)

After two witnesses have reported results, either player can request a jury to contest the result. Three jurors are selected randomly. If you see a jury duty entry on your "Witness" page, click it and vote in the panel on the right.

## Resolving a challenge

![Screenshot](screenshots/paying_out.png)

If the dispute period passes and neither user disputes the results for a game, the "Payout Funds" button appears. Anyone can click that button, but most likely the winner will want to click it.

![Screenshot](screenshots/paying_out_metamask.png)

MetaMask will appear once, and you should approve the transaction.

![Screenshot](screenshots/paying_out_done.png)

Once the transaction has confirmed in the blockchain, the challenge details will update.

![Screenshot](screenshots/finished_jury_example.png)

Here is an example where the jurors voted 3-0 that the result should not change, and the challenge was paid out.

## Rescuing funds

![Screenshot](screenshots/rescue_funds.png)

If a challenge fails (because nobody joined the challenge, the host failed to start the game, or the witnesses failed to respond), a "Rescue Funds" button will appear, and either player can trigger a transaction to send all the funds back to the players who deposited.

![Screenshot](screenshots/rescue_funds_metamask.png)

MetaMask will appear once, and you should approve the transaction. Once the transaction has been confirmed in the blockchain, the challenge smart contract will returns funds to your account, and the challenge will disappear.
