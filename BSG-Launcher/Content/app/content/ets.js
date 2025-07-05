function showEtsPage() {
	if($('#ets_content').length) {
		let cacheKey = window.games.selectedGameName + '_' + window.selectedBranch?.name+'_etsPage_'+window.settings.language,
			data = getContentCache(cacheKey)
		if(data === null) {
			ApiWebsite.getEtsInfo(window.settings.language, function(response) {
				data = JSON.parse(response)
				setContentCache(cacheKey, data, Date.now()+window.contentCacheInterval)
				renderEtsPage (data)
			})
		} else {
			renderEtsPage (data)
		}

	}
}

function renderEtsPage (response) {
	try {
		if(typeof response.status !== 'undefined') {
			setUserETSStatus(response.status)
		}

		$('#ets_content').html('<div class="container small">'+'<div class="title">'+response.title+'</div>'+response.content+'</div>')
			.promise().done(function(){
				$("#sign_ets_nda").on('change', function (e) {
					if($("#sign_ets_nda").is(':checked')) {
						$('[data-action="etsSignup"]').removeClass('disabled')
					} else {
						$('[data-action="etsSignup"]').addClass('disabled')
					}
				})
				showUserEtsStatus(response.status)

				$("[data-action='etsSignup']").off('click').on('click', signupButtonClickCallback)
				$('#ets_content').stop(true,false).fadeIn(window.fadeInSpeed)
			})

	} catch (e) {
		console.log(e)
	}
}

function signupButtonClickCallback(e) {
	e.preventDefault()
	if(!$(this).hasClass('disabled')) {
		$("[data-status]:not(.hidden)").fadeOut(window.fadeOutSpeed, function(e) {
			$("[data-status]").addClass('hidden')
			ApiWebsite.signUpEts(function(signupResponse) {
				signupResponse = JSON.parse(signupResponse)
				if(typeof signupResponse.status !== 'undefined') {
					setUserETSStatus(signupResponse.status)
				}
			}, etsSignupErrorCallback)
		})
	}
}

function etsSignupErrorCallback(httpCode, errorCode, errorArgs) {
	errorArgs = errorArgs ? JSON.parse(errorArgs) : errorArgs
	showCodeError(
		errorCode,
		"error_msg_"+errorCode,
		errorArgs
	)
}

function showUserEtsStatus(status) {
	$("[data-status]").addClass('hidden')
	$("[data-status='"+status+"']").hide().removeClass('hidden').fadeIn(window.fadeInSpeed)
}

