(function() {
'use strict';
angular.module('app.common').factory('CommonService', CommonService);
function CommonService($http, $q, SERVER_URL, $rootScope, CONSTANTS) {	
	return {
		/*
		* @method - apiCall
		* @parameters - url, method, obj
		* @desc  - common api caling method
		*/
        apiCall: function(url, method, obj) {
			var deferred = $q.defer();
        	$http({
				method: method,
				url: url,
				headers: {
	                "Content-Type": 'application/json',
	                "Cache-Control": 'no-cache'
	            },
				data: obj,
				cache: false
	        }).then(function (result) {
                deferred.resolve(result.data)
            },function (error) {
                deferred.reject(error)
            });
        	return deferred.promise;
        },

		/*
		* @method - isLoggedIn
		* @parameters - 
		* @desc  - Check User is logged in or not method
		*/        
		isLoggedIn: function() {
			if(typeof (Storage) !== 'undefined'){
				if(localStorage.user){
					return true;
				}
			}
			return false;
		},

		/*
		* @method - getStorage
		* @parameters - keyName 
		* @desc  - Get value from localStorage by keyName method
		*/		
		getStorage: function(keyName) {
			return localStorage.getItem(keyName);
		},

		/*
		* @method - setStorage
		* @parameters - name, value
		* @desc  - Set localStorage value by key method
		*/		
		setStorage: function(name, value) {
			localStorage.setItem(name, value);
		},

		/*
		* @method - deleteStorage
		* @parameters - key
		* @desc  - Remove value from localStorage by key method
		*/		
		deleteStorage: function(key) {
			return localStorage.removeItem(key);
		}
	}
}
})();