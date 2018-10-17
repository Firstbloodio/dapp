(function() {
'use strict';
angular.module('app.common')
.filter("gameFilter", gameFilter)
.filter("gameStatus", gameStatus)
.filter("gameOutcome", gameOutcome)
.filter("eventStatus", eventStatus);



/*
* @method - gameFilter
* @parameters - 
* @desc  - get game details by filters
*/
function gameFilter() {
	return function(data, filter, userName) {
		console.log(userName);


		var newGames = [];
		var applyFilter = false;

		angular.forEach(filter, function(value, key){
			if(value) {
				applyFilter = true;
			}

		});

		if(applyFilter) {
			angular.forEach(data, function(value, key){
				if(filter.myGameOnly && value.key == userName) {
					newGames.push(value);
				} else if(filter.open  && value.event == 'NewChallenge') {
					newGames.push(value);
				} else if(filter.inProgress && value.event == 'inProgress') {
					newGames.push(value);
				} else if(filter.finished && value.event == 'finished') {
					newGames.push(value);
				} else  if(filter.reputation && value.reputation > filter.reputation ) {
					newGames.push(value);
				}
			});
		} else {
			newGames = data;
		}

/*		if(filter.myGameOnly){
			console.log(data[0]);
			return [data[0]];
		}*/

		return newGames;
	}
}


/*
* @method - eventStatus
* @parameters - 
* @desc  - get event custom status
*/

function eventStatus() {
	return function(input) {

		if(input == 'NewChallenge') 
			return 'Challenge Created'

		if(input == 'Fund')
			return 'Challenge Funded'

		if(input == 'Respond')
			return 'Challenge Accepted'

		if(input == 'Host')
			return 'Awaiting Host'

		return input;
	}
}

/*
* @method - gameStatus
* @parameters - 
* @desc  - get game custom status
*/

function gameStatus() {
	return function(input) {

		if(input == 'NewChallenge' || input == 'Fund')
			return 'Open Challenge';

		if(input == 'Respond' || input == 'Host' || input == 'SetWitnessJuryKey' || input == 'RequestJury')
			return 'Ongoing Challenge';

		if(input == 'Resolve' || input == 'Rescue')
			return 'Finished Challenge';		

		return input;
	}
}

/*function gameStatus() {
	return function(input) {

		if(input == 'NewChallenge' || input == 'Fund')
			return 'Open Challenge';

		if(input == 'Respond' || input == 'Host' || input == 'SetWitnessJuryKey')
			return 'Ongoing Challenge';

		if(input == 'finishedChallenge')
			return 'Finished Challenge';		

		return input;
	}
}*/

function gameOutcome() {
	return function(input) {

		if(input == 'NewChallenge' || input == 'Fund')
			return 'Pending';

		if(input == 'Respond' || input == 'Host' || input == 'SetWitnessJuryKey' || input == 'RequestJury')
			return 'Pending';

		if(input == 'Rescue')
			return 'Rescue'

		if(input == 'Resolve')
			return 'Win / Loss';		

		return input;
	}
}



})();