var savedLogin = '',
	loginChanged = false,
	submitButton = $('button[type="submit"]');

function initLoginPage(saveLogin, savePassword, email) {
	var seconds = 0;
	GoToPage('/page/login');

	if (saveLogin) {
		if (email) {
			window.savedLogin = email;
			$('#email').val(maskEmail(email, '*'));
		}
	}
	if (savePassword) {
		$('#password').val("********");
	}

	initPasswordEyeListener()

	$('#email').on('focus', function (e) {
		if (!window.loginChanged) {
			window.loginChanged = true;
			$('#email').val("");
		}
	});

	$('#LauncherLogin').on('submit', function (e) {
		e.stopPropagation();
		e.preventDefault();

		let emailVal = $('#email').val(),
			passwordVal = $('#password').val()

		if (!window.loginChanged) {
			emailVal = window.savedLogin;
		}

		if (!$(submitButton).hasClass('disabled')) {
			unsetLoginError();
			hideCaptcha();
			showAuthLoader();

			if (!$('.fields>.login').hasClass('hidden')) {
				launcherLogin(emailVal, passwordVal, $("#g-recaptcha-response").val());
			} else if (!$('.fields>.secondfactor').hasClass('hidden')) {

				let email = emailVal && emailVal.length ? emailVal : null,
					password = passwordVal && passwordVal.length ? passwordVal : null,
					deviceId = $('#deviceid').val()

				launcherActivateDevice(email, password, deviceId)

			} else if (!$('.fields>.smsFormPhone').hasClass('hidden')) {

				let email = emailVal && emailVal.length ? emailVal : null,
					phoneNumber = $('#phoneNumber').val()

				launcherVerifyPhone(email, phoneNumber, function (response) {
					try {
						response = JSON.parse(response);
						console.log(response);
						hideAuthLoader();
						if (response && response.result && response.result.expire) {
							showSmsValidationCode(response.result.expire);
							resizeWindow(null, null);
						}
					} catch (e) {
						console.log(e);
					}
				});

			} else if (!$('.fields>.smsFormCode').hasClass('hidden')) {

				let email = emailVal && emailVal.length ? emailVal : null,
					password = passwordVal && passwordVal.length ? passwordVal : null,
					phoneCode = $('#phoneCode').val()

				launcherVerifyCode(email, password, phoneCode, function (response) {
					try {
						response = JSON.parse(response);
						console.log(response);
						hideAuthLoader();
						resizeWindow(null, null);
					} catch (e) {
						console.log(e);
					}
				});
			}
		} else {
			console.log('Button is disabled for now.');
		}
		lockLoginButton();
	});
	$('#LauncherLogin .back_button').on('click', function (e) {
		e.preventDefault();
		hideActivationCodeForm();
		hideSmsValidation();
	});
}

function lockLoginButton() {
	submitButton.addClass('disabled')
}

function unlockLoginButton(delay) {
	let seconds = delay || 0
	if (seconds > 0) {
		$('#loginButtonText').fadeOut(function (e) {
			$('#loginButtonCountdown').html(renderSeconds(seconds)).fadeIn()
		})

		new Countdown({
			uniqueKey: 'loginCountdown',
			seconds: seconds,  // number of seconds to count down
			onUpdateStatus: function (sec) {
				$('#loginButtonText').fadeOut(function (e) {
					$('#loginButtonCountdown').html(renderSeconds(sec))
				})
				$('[data-countdown]').html(renderSeconds(sec))
			}, // callback for each second
			onCounterEnd: function () {
				submitButton.removeClass('disabled')
				$('#loginButtonCountdown').fadeOut(function (e) {
					$('#loginButtonText').fadeIn()
				})
			} // final action
		}).start()
	} else {
		submitButton.removeClass('disabled')
	}
}

/**
 * SMS validation js
 */
function displayActivationCodeForm() {
	var loginForm = $('#LauncherLogin');
	hideAuthLoader();
	unlockLoginButton(0);
	loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
		loginForm.find('.fields>.login').addClass('hidden');
		loginForm.find('.fields>.smsFormPhone').addClass('hidden');
		loginForm.find('.fields>.smsFormCode').addClass('hidden');
		loginForm.find('.fields>.secondfactor').removeClass('hidden');
		// font changing code here
		loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
			resizeWindow(null, null);
		});
	});
}

function hideActivationCodeForm() {
	var loginForm = $('#LauncherLogin');
	if (loginForm.length) {
		loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
			loginForm.find('.fields>.login').removeClass('hidden');
			loginForm.find('.fields>.smsFormPhone').addClass('hidden');
			loginForm.find('.fields>.smsFormCode').addClass('hidden');
			loginForm.find('.fields>.secondfactor').addClass('hidden');
			$('#deviceid').val('');
			unlockLoginButton(0);
			resizeWindow(null, null);
			// font changing code here
			loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
				resizeWindow(null, null);
			});
		});
	}
}
/**
 * EOF SMS validation js
 */


/**
 * Phone validation js
 ***/
function showSmsValidationPhone(geoInfo) {
	window.settings.account.geoInfo = geoInfo
	var loginForm = $('#LauncherLogin');
	hideAuthLoader();
	unlockLoginButton(0);
	loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
		loginForm.find('.fields>.login').addClass('hidden');
		loginForm.find('.fields>.secondfactor').addClass('hidden');
		loginForm.find('.fields>.smsFormCode').addClass('hidden');
		loginForm.find('.fields>.smsFormPhone').removeClass('hidden');
		// font changing code here
		loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
			resizeWindow(null, null);
			$("#phoneNumber").bind("keyup", function () {
				validatePhone();
			});
			validatePhone();
			setFormatPhone(formatPhone());
		});
	});
}

function showSmsValidationCode(codeExpire) {
	var loginForm = $('#LauncherLogin'),
		expire = codeExpire || null;
	hideAuthLoader();
	unlockLoginButton(0);
	loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
		loginForm.find('.fields>.login').addClass('hidden');
		loginForm.find('.fields>.secondfactor').addClass('hidden');
		loginForm.find('.fields>.smsFormPhone').addClass('hidden');
		loginForm.find('.fields>.smsFormCode').removeClass('hidden');
		// font changing code here
		if (expire) {
			initCodeExpire(expire);
		}

		loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
			resizeWindow(null, null);
			$("#phoneCode").bind("keyup", function () {
				validateCode();
			});
			validateCode();
		});
	});
}

function hideSmsValidation() {
	var loginForm = $('#LauncherLogin');
	if (loginForm.length) {
		loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
			loginForm.find('.fields>.login').removeClass('hidden');
			loginForm.find('.fields>.secondfactor').addClass('hidden');
			loginForm.find('.fields>.smsFormPhone').addClass('hidden');
			loginForm.find('.fields>.smsFormCode').addClass('hidden');
			$('#phoneNumber').val('').unbind("keyup");
			$('#phoneCode').val('');
			unlockLoginButton(0);
			resizeWindow(null, null);
			// font changing code here
			loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
				resizeWindow(null, null);
			});
		});
	}
}

function formatPhone() {
	try {
		let country = window.settings.account.geoInfo.country,
			libPhone = new libphonenumber.AsYouType(country),
			val_old = $("#phoneNumber").val(),
			phoneNumber = new libphonenumber.parsePhoneNumber(val_old, country);

		return libPhone.input(phoneNumber.number);
	} catch (e) {
	}
}

function setFormatPhone(newString) {
	$("#phoneNumber").focus().val("").val(newString);
}

function validatePhone() {
	try {
		let country = window.settings.account.geoInfo.country,
			val_old = $("#phoneNumber").val(),
			phone = formatPhone();

		if (val_old.length < 5 || phone.length === 0) {
			lockLoginButton();
			$("[data-phone-number-result]").text("");
			$("[data-phone-number-result]").parent().addClass('hidden');
		} else {
			$("[data-phone-number-result]").text(phone);
			$("[data-phone-number-result]").parent().removeClass('hidden');
		}

		let phoneNumber = new libphonenumber.parsePhoneNumber(val_old, country)

		if (phoneNumber.isValid()) {
			unlockLoginButton();
		} else {
			lockLoginButton();
		}
	} catch (e) {
	}
}

function validateCode() {
	try {
		let valid = false,
			val = $("#phoneCode").val();

		if (val.length === 4 || val.length === 6) {
			valid = true;
		}
		if (valid) {
			unlockLoginButton();
		} else {
			lockLoginButton();
		}
	} catch (e) {
	}
}

function initCodeExpire(codeExpire) {
	let message = i18next.t("Code expires in ", {args: [parseInt(codeExpire)]}),
		$html = $('<div />', {html: message})
	$html.find('[data-countdown]').html(renderSeconds(parseInt(codeExpire)))
	message = $html.html()
	$('[data-code-expire]').html(message).removeClass('hidden')
	new Countdown({
		uniqueKey: 'smsCodeExpireCountdown',
		seconds: parseInt(codeExpire) - 1,  // number of seconds to count down
		onUpdateStatus: function (sec) {
			$('[data-countdown]').html(renderSeconds(sec))
		}, // callback for each second
		onCounterEnd: function () {
			$('[data-code-expire]').fadeOut(window.fadeOutSpeed)
		} // final action
	}).start()
}
/**
 * EOF Phone validation js
 ***/


/**
 * Login Errors
 ***/
function setLoginError(unlockDelay) {
	hideAuthLoader();
	$('#LauncherLogin').addClass('error');
	$('[data-error-container]').removeClass('hidden');
	unlockLoginButton(unlockDelay);
	setTimeout(() => {
		resizeWindow(null, null)
	}, 50)
}

function unsetLoginError() {
	$('#LauncherLogin').removeClass('error');
	$('[data-error-container]').addClass('hidden').find('.text').html('');
	setTimeout(() => {
		resizeWindow(null, null)
	}, 50)
}
/**
 * EOF Login Errors
 ***/
