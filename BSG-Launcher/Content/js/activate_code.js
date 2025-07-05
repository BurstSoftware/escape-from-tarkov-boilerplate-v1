const SUCCESS_MESSAGE_KEY = 'CodeActivatedDefault'
let submitButton = $('.button.huge'),
	codeInput = $('#ActivateCodeInput'),
	errorContainer = $('[data-error-container]')

codeInput.on('change keyup', function (e) {
	if (codeInput.val().length) {
		unlockSubmitButton()
	} else {
		lockSubmitButton()
	}
});

submitButton.on('click', function (e) {
	if (!$(this).hasClass('disabled')) {
		hideError()
		reachClickGoal('click_activate_code')
		launcher.ok(codeInput.val())
		submitButton.addClass('disabled')
	}
});

function lockSubmitButton() {
	submitButton.addClass('disabled')
}

function unlockSubmitButton() {
	submitButton.removeClass('disabled')
}

function errorRenderCallback() {
	showError()
}

function success(data) {
	try {
		hideError()

		let container = $('[data-error-container] .text'),
			string = ''

		if (data && data.message && data.args) {

			let error_text = i18next.t(data.message, {args: data.args}),
				args_json = JSON.stringify({args: data.args})

			string = '<div>' +
				"<p data-i18n='[html]" + data.message + "' data-i18n-options='" + args_json + "'>" + error_text + '</p>' +
				'</div>'

		} else if(data && data.result) {

			string = data.result

		} else {

			string = i18next.t(SUCCESS_MESSAGE_KEY)

		}

		container.append(string)
		whenJqueryFuncAvailable('localize', function () {
			container.localize();
		});

		errorContainer.removeClass('hidden')
		resizeWindow(413, 338)
	} catch (e) {
		console.log(e)
	}
}

function showError() {
	errorContainer.removeClass('hidden').addClass('error')
	resizeWindow(413, 338)
}

function hideError() {
	errorContainer.addClass('hidden').removeClass('error').find('.text').html('')
	resizeWindow(413, 259)
}

