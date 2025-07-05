/**
 * Recaptcha
 */
function initCaptcha() {
	var Captcha_api_url = "https://www.google.com/recaptcha/api.js?hl=" + window.settings.language;
	if (!isScriptLoaded(Captcha_api_url)) {
		var tag, firstScriptTag;
		tag = document.createElement('script');
		tag.src = Captcha_api_url;
		tag.async = true;
		firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}
}

function showCaptcha() {
	initCaptcha();
	whenAvailable('grecaptcha', function () {
		$('form .fields>.login>.captcha.item').removeClass('hidden');
		resizeWindow(null, null);
	});
}

function hideCaptcha() {
	$('form .fields>.login>.captcha.item').addClass('hidden')
	whenAvailable('grecaptcha', function () {
		try {
			window.setTimeout(function () {
				if (typeof grecaptcha.reset === 'function') {
					grecaptcha.reset()
				}
			}, 100)
		} catch (e) {
			console.log(e)
		}
		resizeWindow(null, null)
	});
}
/**
 * EOF Recaptcha
 */
