(function(){
'use strict';
angular.module('app.common')
.directive('headers', headers)
.directive('leftSideMenu', leftSideMenu)
.directive('userProfileModal', userProfileModal)
.directive('otherUserProfileModal', otherUserProfileModal)
.directive('logoutModal', logoutModal)
.directive('processingModal', processingModal)
.directive('whenScrolled', whenScrolled)
.directive('onlyDigits', onlyDigits)
.directive('initModal', initModal)
.directive('footer', footer)
/*
* @method - onlyDigits
* @parameters - 
* @desc  - Show onlyDigits directive
*/
function onlyDigits() {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, element, attr, ctrl) {
        function inputValue(val) {
          if (val) {
            var digits = val.replace(/[^0-9.]/g, '');

            if (digits.split('.').length > 2) {
              digits = digits.substring(0, digits.length - 1);
            }

            if (digits !== val) {
              ctrl.$setViewValue(digits);
              ctrl.$render();
            }
            return parseFloat(digits);
          }
          return undefined;
        }            
        ctrl.$parsers.push(inputValue);
      }
    };
}

/*
* @method - headers
* @parameters - 
* @desc  - Show headers directive
*/
function headers() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/header.html',
    };
}
/*
* @method - footer
* @parameters - 
* @desc  - Show footer directive
*/
function footer() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/footer.html',
    };
}

/*
* @method - headers
* @parameters - 
* @desc  - Show headers directive
*/
function leftSideMenu() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/left_side_menu.html',
    };
}

/*
* @method - logoutModal
* @parameters - 
* @desc  - Show logout modal directive
*/
function logoutModal() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/logout_modal.html',
    };
}

/*
* @method - processingModal
* @parameters - 
* @desc  - Show processing directive
*/
function processingModal() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/transaction_processing.html',
    };
}

/*
* @method - initModal
* @parameters - 
* @desc  - Show processing directive
*/
function initModal() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/init_modal.html',
    };
}

/*
* @method - headers
* @parameters - 
* @desc  - Show headers directive
*/
function userProfileModal() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/user_profile_modal.html',
    };
}

/*
* @method - headers
* @parameters - 
* @desc  - Show headers directive
*/
function otherUserProfileModal() {
    return {
        restrict: 'E',
        templateUrl: 'modules/common/views/other_user_profile_modal.html',
    };
}
/*
* @method - whenScrolled
* @parameters - 
* @desc  - when scrolled directive for infinite scroll
*/
function whenScrolled () {
    return function(scope, elm, attr) {
        var raw = elm[0];
        elm.bind('scroll', function() {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.loading = true;
                scope.$apply(attr.whenScrolled);
            }
        });
    };
}

})();