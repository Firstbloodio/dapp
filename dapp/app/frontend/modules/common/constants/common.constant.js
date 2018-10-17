(function(){
	angular.module('app.common')
	.constant('CONSTANTS', {
		beforeLoginUrl: "configuration",
		afterLoginUrl: "home",
		noRecordFound: "No record available",
		pageSize: 20,
		web3Provider : "https://mainnet.infura.io/Za7wVPPWB81BCrN95zy1",
		etherscanHost : "https://www.etherscan.io/tx/",
		challengeAbi:[{
	        "constant": false,
	        "inputs": [{
	            "name": "hostKey_",
	            "type": "string"
	        }],
	        "name": "host",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": false,
	        "inputs": [],
	        "name": "rescue",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "blockNumber",
	        "outputs": [{
	            "name": "",
	            "type": "uint256"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "key2",
	        "outputs": [{
	            "name": "",
	            "type": "string"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "hostKey",
	        "outputs": [{
	            "name": "",
	            "type": "string"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "juryCalled",
	        "outputs": [{
	            "name": "",
	            "type": "bool"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "key1",
	        "outputs": [{
	            "name": "",
	            "type": "string"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "referrer",
	        "outputs": [{
	            "name": "",
	            "type": "address"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": false,
	        "inputs": [{
	            "name": "witnessJuryKey_",
	            "type": "string"
	        }],
	        "name": "setWitnessJuryKey",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "witnessJury",
	        "outputs": [{
	            "name": "",
	            "type": "address"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "amount",
	        "outputs": [{
	            "name": "",
	            "type": "uint256"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "user1",
	        "outputs": [{
	            "name": "",
	            "type": "address"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": false,
	        "inputs": [{
	                "name": "user2_",
	                "type": "address"
	            },
	            {
	                "name": "key2_",
	                "type": "string"
	            }
	        ],
	        "name": "respond",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "blockPeriod",
	        "outputs": [{
	            "name": "",
	            "type": "uint256"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": false,
	        "inputs": [],
	        "name": "fund",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "user2",
	        "outputs": [{
	            "name": "",
	            "type": "address"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": false,
	        "inputs": [{
	                "name": "witnessJuryRequestNum_",
	                "type": "uint256"
	            },
	            {
	                "name": "juryContested",
	                "type": "bool"
	            },
	            {
	                "name": "majorityJurors",
	                "type": "address[]"
	            },
	            {
	                "name": "winner_",
	                "type": "uint256"
	            },
	            {
	                "name": "witness1",
	                "type": "address"
	            },
	            {
	                "name": "witness2",
	                "type": "address"
	            },
	            {
	                "name": "witnessJuryRewardPercentage",
	                "type": "uint256"
	            }
	        ],
	        "name": "resolve",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": false,
	        "inputs": [],
	        "name": "requestJury",
	        "outputs": [],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "rescued",
	        "outputs": [{
	            "name": "",
	            "type": "bool"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "fee",
	        "outputs": [{
	            "name": "",
	            "type": "uint256"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "winner",
	        "outputs": [{
	            "name": "",
	            "type": "uint256"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "witnessJuryRequestNum",
	        "outputs": [{
	            "name": "",
	            "type": "uint256"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "funded",
	        "outputs": [{
	            "name": "",
	            "type": "bool"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "host",
	        "outputs": [{
	            "name": "",
	            "type": "address"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "token",
	        "outputs": [{
	            "name": "",
	            "type": "address"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "constant": true,
	        "inputs": [],
	        "name": "witnessJuryKey",
	        "outputs": [{
	            "name": "",
	            "type": "string"
	        }],
	        "payable": false,
	        "stateMutability": "view",
	        "type": "function"
	    },
	    {
	        "inputs": [{
	                "name": "witnessJury_",
	                "type": "address"
	            },
	            {
	                "name": "token_",
	                "type": "address"
	            },
	            {
	                "name": "amount_",
	                "type": "uint256"
	            },
	            {
	                "name": "user1_",
	                "type": "address"
	            },
	            {
	                "name": "key1_",
	                "type": "string"
	            },
	            {
	                "name": "blockPeriod_",
	                "type": "uint256"
	            },
	            {
	                "name": "referrer_",
	                "type": "address"
	            }
	        ],
	        "payable": false,
	        "stateMutability": "nonpayable",
	        "type": "constructor"
	    },
	    {
	        "anonymous": false,
	        "inputs": [{
	                "indexed": false,
	                "name": "amount",
	                "type": "uint256"
	            },
	            {
	                "indexed": false,
	                "name": "user1",
	                "type": "address"
	            },
	            {
	                "indexed": false,
	                "name": "key1",
	                "type": "string"
	            }
	        ],
	        "name": "NewChallenge",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [],
	        "name": "Fund",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [{
	                "indexed": false,
	                "name": "user2",
	                "type": "address"
	            },
	            {
	                "indexed": false,
	                "name": "key2",
	                "type": "string"
	            }
	        ],
	        "name": "Respond",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [{
	                "indexed": false,
	                "name": "host",
	                "type": "address"
	            },
	            {
	                "indexed": false,
	                "name": "hostKey",
	                "type": "string"
	            }
	        ],
	        "name": "Host",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [{
	                "indexed": false,
	                "name": "witnessJuryRequestNum",
	                "type": "uint256"
	            },
	            {
	                "indexed": false,
	                "name": "witnessJuryKey",
	                "type": "string"
	            }
	        ],
	        "name": "SetWitnessJuryKey",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [],
	        "name": "RequestJury",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [{
	                "indexed": false,
	                "name": "winner",
	                "type": "uint256"
	            },
	            {
	                "indexed": false,
	                "name": "wasContested",
	                "type": "bool"
	            },
	            {
	                "indexed": false,
	                "name": "winnerAmount",
	                "type": "uint256"
	            },
	            {
	                "indexed": false,
	                "name": "hostAmount",
	                "type": "uint256"
	            },
	            {
	                "indexed": false,
	                "name": "witnessJuryAmount",
	                "type": "uint256"
	            }
	        ],
	        "name": "Resolve",
	        "type": "event"
	    },
	    {
	        "anonymous": false,
	        "inputs": [],
	        "name": "Rescue",
	        "type": "event"
	    }
	],
		standardTokenAddr : "0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7",
		standardTokenAbi : [{
		        "constant": false,
		        "inputs": [{
		                "name": "_spender",
		                "type": "address"
		            },
		            {
		                "name": "_value",
		                "type": "uint256"
		            }
		        ],
		        "name": "approve",
		        "outputs": [{
		            "name": "success",
		            "type": "bool"
		        }],
		        "payable": false,
		        "stateMutability": "nonpayable",
		        "type": "function"
		    },
		    {
		        "constant": true,
		        "inputs": [],
		        "name": "totalSupply",
		        "outputs": [{
		            "name": "",
		            "type": "uint256"
		        }],
		        "payable": false,
		        "stateMutability": "view",
		        "type": "function"
		    },
		    {
		        "constant": false,
		        "inputs": [{
		                "name": "_from",
		                "type": "address"
		            },
		            {
		                "name": "_to",
		                "type": "address"
		            },
		            {
		                "name": "_value",
		                "type": "uint256"
		            }
		        ],
		        "name": "transferFrom",
		        "outputs": [{
		            "name": "success",
		            "type": "bool"
		        }],
		        "payable": false,
		        "stateMutability": "nonpayable",
		        "type": "function"
		    },
		    {
		        "constant": true,
		        "inputs": [{
		            "name": "",
		            "type": "address"
		        }],
		        "name": "balances",
		        "outputs": [{
		            "name": "",
		            "type": "uint256"
		        }],
		        "payable": false,
		        "stateMutability": "view",
		        "type": "function"
		    },
		    {
		        "constant": true,
		        "inputs": [{
		                "name": "",
		                "type": "address"
		            },
		            {
		                "name": "",
		                "type": "address"
		            }
		        ],
		        "name": "allowed",
		        "outputs": [{
		            "name": "",
		            "type": "uint256"
		        }],
		        "payable": false,
		        "stateMutability": "view",
		        "type": "function"
		    },
		    {
		        "constant": true,
		        "inputs": [{
		            "name": "_owner",
		            "type": "address"
		        }],
		        "name": "balanceOf",
		        "outputs": [{
		            "name": "balance",
		            "type": "uint256"
		        }],
		        "payable": false,
		        "stateMutability": "view",
		        "type": "function"
		    },
		    {
		        "constant": false,
		        "inputs": [{
		                "name": "_to",
		                "type": "address"
		            },
		            {
		                "name": "_value",
		                "type": "uint256"
		            }
		        ],
		        "name": "transfer",
		        "outputs": [{
		            "name": "success",
		            "type": "bool"
		        }],
		        "payable": false,
		        "stateMutability": "nonpayable",
		        "type": "function"
		    },
		    {
		        "constant": true,
		        "inputs": [{
		                "name": "_owner",
		                "type": "address"
		            },
		            {
		                "name": "_spender",
		                "type": "address"
		            }
		        ],
		        "name": "allowance",
		        "outputs": [{
		            "name": "remaining",
		            "type": "uint256"
		        }],
		        "payable": false,
		        "stateMutability": "view",
		        "type": "function"
		    },
		    {
		        "anonymous": false,
		        "inputs": [{
		                "indexed": true,
		                "name": "_from",
		                "type": "address"
		            },
		            {
		                "indexed": true,
		                "name": "_to",
		                "type": "address"
		            },
		            {
		                "indexed": false,
		                "name": "_value",
		                "type": "uint256"
		            }
		        ],
		        "name": "Transfer",
		        "type": "event"
		    },
		    {
		        "anonymous": false,
		        "inputs": [{
		                "indexed": true,
		                "name": "_owner",
		                "type": "address"
		            },
		            {
		                "indexed": true,
		                "name": "_spender",
		                "type": "address"
		            },
		            {
		                "indexed": false,
		                "name": "_value",
		                "type": "uint256"
		            }
		        ],
		        "name": "Approval",
		        "type": "event"
		    }
		],
		challengeFactoryAddr : "0x18dc28340ddde25fa8c3b51f5d6a82b1706c8e20",
		challengeFactoryAbi : [
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "challenges",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			},
			{
				"name": "user",
				"type": "address"
			},
			{
				"name": "key",
				"type": "string"
			},
			{
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "newChallenge",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "witnessJury_",
				"type": "address"
			},
			{
				"name": "token_",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "addr",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "key",
				"type": "string"
			}
		],
		"name": "NewChallenge",
		"type": "event"
	}
],
witnessAddr: "0x494d274563f2bd7433a1660be26244a84cf4b4d9",
witnessJuryAbi:[
	{
		"constant": true,
		"inputs": [],
		"name": "drmVolumeCap",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "penalty",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "key",
				"type": "string"
			},
			{
				"name": "challenge",
				"type": "address"
			}
		],
		"name": "newRequest",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"name": "answer",
				"type": "string"
			},
			{
				"name": "winner",
				"type": "uint256"
			}
		],
		"name": "report",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "getWinner2",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "balances",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "juryNoCount",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "drmMinFee",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "juryYesVoters",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "desiredWitnesses",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "drmMaxFee",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "resolve",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"name": "witness",
				"type": "address"
			}
		],
		"name": "isWitness",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "user",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "numWitnesses",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "witness",
				"type": "address"
			}
		],
		"name": "reduceToLimit",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "requests",
		"outputs": [
			{
				"name": "key",
				"type": "string"
			},
			{
				"name": "witness1",
				"type": "address"
			},
			{
				"name": "witness2",
				"type": "address"
			},
			{
				"name": "answer1",
				"type": "string"
			},
			{
				"name": "answer2",
				"type": "string"
			},
			{
				"name": "winner1",
				"type": "uint256"
			},
			{
				"name": "winner2",
				"type": "uint256"
			},
			{
				"name": "fee",
				"type": "uint256"
			},
			{
				"name": "challenge",
				"type": "address"
			},
			{
				"name": "blockNumber",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "getWinner1",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"name": "vote",
				"type": "bool"
			}
		],
		"name": "juryVote",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "numRequests",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "numWitnessesBeforeLimit",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "limit",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "juryYesCount",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "juryNoVoters",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "totalBalance",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "blockPeriod",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "deposit",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"name": "juryVoted",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "getRequest",
		"outputs": [
			{
				"name": "",
				"type": "string"
			},
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "address"
			},
			{
				"name": "",
				"type": "string"
			},
			{
				"name": "",
				"type": "string"
			},
			{
				"name": "",
				"type": "uint256"
			},
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "requestsPerBlockGroup",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "juryNeeded",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "token",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"name": "juror",
				"type": "address"
			}
		],
		"name": "isJuror",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "desiredJurors",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "token_",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Deposit",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Withdraw",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "witness",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "ReduceToLimit",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "answer",
				"type": "string"
			},
			{
				"indexed": false,
				"name": "winner",
				"type": "uint256"
			}
		],
		"name": "Report",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "key",
				"type": "string"
			}
		],
		"name": "NewRequest",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "JuryNeeded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "requestNum",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "juror",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "vote",
				"type": "bool"
			}
		],
		"name": "JuryVote",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "Resolve",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "requestNum",
				"type": "uint256"
			}
		],
		"name": "JuryContested",
		"type": "event"
	}
]
	});
})();
