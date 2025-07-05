/**
 * Errors contants list
 */
const ERR_WRONG_EMAIL_PASS = 206;
const ERR_RECEIVED_NEW_HARDWARE = 209;
const ERR_ACCOUNT_BLOCKED = 229;
const ERR_PHONE_NUMBER_ACTIVATION_REQUIRED = 240;
const ERR_PHONE_VALIDATION_CODE_REQUIRED = 243;
const ERR_AC_FORM_FIELDS_ERROR = 201004;
const ERR_AC_RECEIVED_NEW_HARDWARE = 202007;
const ERR_AC_PHONE_NUMBER_ACTIVATION_REQUIRED = 202008;
const ERR_AC_PHONE_VALIDATION_CODE_REQUIRED = 202009;

const SKIP_ERROR_DISPLAY = [
	ERR_RECEIVED_NEW_HARDWARE,
	ERR_AC_RECEIVED_NEW_HARDWARE
]

const TYPE_NETWORK_EXCEPTION = 'NetworkException';
const mainButtonTimeouts = [0, 5, 15, 30, 60];
var currentNetworkErrorsCount = 0;


/**
 * code formatting rules:
 *  132031
 *  1 - тип ошибки
 *  32 - категория ошибок
 *  031 - номер ошибки
 */
function error(data) {
	try {
		if(window.environment !== 'Production') {
			console.log(data);
		}
		whenAvailable("i18nLoaded", function() {
			var exception = data.exception || null,
				errorContainer = $('[data-error-container]'),
				result = $('[data-error-container] .text')
			let lockButtonDelay = 0;

			while (exception !== null) {
				var code = exception.code || 0,
					args = exception.data || {},
					message = exception.message || '',
					type = exception.type || '',
					string = null;

				if (type === TYPE_NETWORK_EXCEPTION) {
					try {
						var timeoutIndex = Math.min.apply(null, [currentNetworkErrorsCount, mainButtonTimeouts.length - 1]);
						args.ban_time_left = mainButtonTimeouts[timeoutIndex];
					} catch (e) {
					}
					currentNetworkErrorsCount++;
				}

				string = customErrorHandler(code, args);

				if(skipMessageDisplay(code) && isLoginPage()) {
					return false;
				}

				/** message from localisation */
				if (!string) {
					string = parseErrorCode(code, args);
				}
				/** message from api */
				if (!string) {
					string = renderErrorMessageWithCode(message, code);
				}
				/** unknownError */
				if (!string) {
					string = renderErrorCodeArgs('0', []);
				}

				if(args && (args.ban_time_left || args['Retry-After'])) {
					lockButtonDelay = args.ban_time_left || args['Retry-After'];
				}

				result.append(string);
				result = $('[data-error-container] .text .errorItem:last');

				exception = exception.innerException || null;
			}

			errorContainer.localize();

			if(typeof errorRenderCallback === 'function') {
				errorRenderCallback()
			}

			if (isLoginPage()) {
				setLoginError(lockButtonDelay)
			} else {
				errorMessageCountdown(lockButtonDelay)
			}
		});
	} catch (e) {
		console.log(e);
	}
}

function customErrorHandler(code, args) {
	var message = null;

	if (args.captchaRequired && typeof showCaptcha === 'function') {
		showCaptcha();
	}

	if (code === ERR_RECEIVED_NEW_HARDWARE && typeof displayActivationCodeForm === 'function') {
		displayActivationCodeForm();
	}

	if (code === ERR_AC_RECEIVED_NEW_HARDWARE && typeof displayActivationCodeForm === 'function') {
		displayActivationCodeForm();
	}

	if (code === ERR_PHONE_NUMBER_ACTIVATION_REQUIRED && typeof showSmsValidationPhone === 'function' && args.geo_info) {
		showSmsValidationPhone(args.geo_info)
	}

	if (code === ERR_AC_PHONE_NUMBER_ACTIVATION_REQUIRED && typeof showSmsValidationPhone === 'function' && args.geo_info) {
		showSmsValidationPhone(args.geo_info)
	}

	if (code === ERR_PHONE_VALIDATION_CODE_REQUIRED && typeof showSmsValidationCode === 'function' && args.phoneValidationCodeExpire) {
		showSmsValidationCode(args.phoneValidationCodeExpire)
	}

	if (code === ERR_AC_PHONE_VALIDATION_CODE_REQUIRED && typeof showSmsValidationCode === 'function' && args.phoneValidationCodeExpire) {
		showSmsValidationCode(args.phoneValidationCodeExpire)
	}

	if (code === ERR_AC_FORM_FIELDS_ERROR) {
		message = i18next.t(errorMessageLangPrefix + code) + "<br><br>"
		for (const [input, errors] of Object.entries(args)) {
			switch (input) {
				case 'captcha':
					if(typeof showCaptcha === 'function') {
						showCaptcha()
					}
					message += i18next.t("error_msg_214") + '<br>'
					break
				default:
					errors.forEach((errorMsg)=>{
						message += errorMsg + '<br>'
					})
					break
			}
		}
	}

	if (code === ERR_WRONG_EMAIL_PASS) {
		message = i18next.t(errorMessageLangPrefix + code);
		if (args.banAttemptsLeft && args.banAttemptsLeft > 0) {
			message += "<br>" +
				i18next.t(errorMessageLangPrefix + code + "_1", {args: [args.banAttemptsLeft]});
		}
	}

	if (code === ERR_ACCOUNT_BLOCKED) {
		if (args.ban_time_left && args.ban_time_left > 0) {
			//TempBanned
			message = i18next.t(errorMessageLangPrefix + code + "_1", {args: [args.ban_time_left]});
		} else {
			//PermanentBanned
			message = i18next.t(errorMessageLangPrefix + code);
		}
	}

	if (message) {
		message = renderErrorMessageWithCode(message, code);
	}

	return message;
}

function skipMessageDisplay(code) {
	return SKIP_ERROR_DISPLAY.includes(code);
}

function errorMessageCountdown(delay) {
	let seconds = delay || 0
	$('[data-countdown]').html(renderSeconds(seconds))
	if (seconds-1 > 0) {
		new Countdown({
			uniqueKey: 'errorMessageCountdown',
			seconds: seconds-1,  // number of seconds to count down
			onUpdateStatus: function (sec) {
				$('[data-countdown]').html(renderSeconds(sec))
			}, // callback for each second
			onCounterEnd: function () {
				if(typeof unlockSubmitButton === 'function') {
					unlockSubmitButton(seconds)
				}
			} // final action
		}).start()
	} else {
		if(typeof unlockSubmitButton === 'function') {
			unlockSubmitButton(seconds)
		}
	}
}

/**
 * Render error methods
 */
function parseErrorCode(code, args) {
	if (!code || code === 0) {
		return null;
	}
	return renderErrorCodeArgs(code.toString(), args);
}

function renderErrorCodeArgs(full_code, args) {
	try {
		var error_label = errorMessageLangPrefix + full_code,
			error_text = i18next.t(error_label, {args: args}),
			args_json = JSON.stringify({args: args});
		if(error_text === error_label) {
			return null;
		}
		return '<div class="errorItem">' +
			"<p data-i18n='[html]" + error_label + "' data-i18n-options='" + args_json + "'>" + error_text + '</p>' +
			'<p class="code"><span class="uppercase" data-i18n="Error">ERROR</span>: <span class="value">' + full_code + '</span></p>' +
			'</div>';
	} catch (e) {
		console.log(e);
	}
}

function renderErrorMessageWithCode(text, code) {
	try {
		return '<div class="errorItem">' +
			'<p>' + text + '</p>' +
			'<p class="code"><span class="uppercase" data-i18n="Error">ERROR</span>: <span class="value">' + code + '</span></p>' +
			'</div>';
	} catch (e) {
		console.log(e);
	}
}

/**
 * EOF Render error methods
 */

