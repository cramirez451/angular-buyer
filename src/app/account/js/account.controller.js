angular.module('orderCloud')
	.controller('AccountCtrl', AccountController)
;

function AccountController($exceptionHandler, $uibModal, toastr, OrderCloudSDK, ocAccount, CurrentUser){
	var vm = this;
	vm.profile = angular.copy(CurrentUser);
	vm.currentUser = CurrentUser;

	vm.usernameChange = function () {
		vm.settingsForm.Username.$setValidity('User.UsernameMustBeUnique', true);
	};

	vm.updateProfile = function () {
		ocAccount.ConfirmPassword(vm.currentUser)
			.then(function () {
				vm.profileUpdateLoading = OrderCloudSDK.Me.Patch(_.pick(vm.profile, ['FirstName', 'LastName', 'Email', 'Phone']))
					.then(function (updatedUser) {
						vm.profile = angular.copy(updatedUser);
						vm.currentUser = updatedUser;
						vm.profileForm.$setPristine();
						toastr.success('Your profile information was updated.');
					});
			});
	};

	vm.flagwarning = flagerrors;

	vm.flagwarning = 1

	vm.flaganotherwarning = 2

	vm.updateUsername = function () {
		ocAccount.ConfirmPassword(vm.currentUser)
			.then(function () {
				vm.profileUpdateLoading = OrderCloudSDK.Me.Patch(_.pick(vm.profile, 'Username'))
					.then(function (updatedUser) {
						vm.profile = angular.copy(updatedUser);
						vm.currentUser = updatedUser;
						vm.settingsForm.$setPristine();
						toastr.success('Your username was updated.');
					})
					.catch(function (ex) {
						if (ex.status === 409) {
							vm.settingsForm.Username.$setValidity(ex.data.Errors[0].ErrorCode, false);
						}
						$exceptionHandler(ex);
					});
			});
	};

	vm.changePassword = function () {
		ocAccount.ChangePassword(vm.currentUser)
			.then(function () {
				toastr.success('Your password was successfully changed. Next time you log in you will have to use your new password.');
			});
	};
}