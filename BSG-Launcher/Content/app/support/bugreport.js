let themeId = null,
	selectedCatId = false

/** PreFetch Templates */
getTemplate('support/ticket_create_form.html')
getTemplate('support/ticket_files_form.html')


$(document).ready(function () {
	whenAvailable('launcher', function () {
		try {
			getSupportConfiguration()
			initSteps()
			$(document).on('click', '#add_files', addFiles)
			$(document).on('change', '[data-add-client-logs]', prepareZip)
			$(document).on('change', '[data-add-launcher-logs]', prepareZip)
			whenJqueryFuncAvailable('localize', function () {
				$('#message').localize()
			})
		} catch (e) {
			console.log(e)
		}
	})
})

function addFiles(){
	launcher.showBugReportSelectionDialog(i18next.t("Add files")).then(function (data) {
		data = $.parseJSON(data)
		if (window.environment !== "Production") {
			console.log(data)
		}
		if (data && data.selected_files) {
			$.each(data.selected_files, function (i, v) {
				if (!$('[data-file="' + v.path + '"]').length) {
					let filename = v.path.split('/').pop()
					$('[data-selected-files]').append(
						'<li data-file="' + v.path + '">' + filename +
						'<div class="button inline" data-remove><i class="icon exit"></i></div>' +
						'</li>')
				}
			})

			$('[data-remove]').off('click').on('click', function () {
				$(this).parent().remove()
				prepareZip()

				revalidateFileNotEmpty()
			})

			revalidateFileNotEmpty()
		}
		prepareZip()
	})
}

function preparePostData() {
	let data = {
			themeId: window.themeId,
			category: parseInt(window.selectedCatId),
			poolsData: getPollsDataString(),
			message: '-',
			files: []
		}

	if($('#bug_text').length) {
		data.message = $('#bug_text').val() + '\r\n' + '\r\n'
		if($('[data-step-list] .step-item').length) {
			data.message += i18next.t("Reproduce steps") + '\r\n'
			$('[data-step-list] .step-item').each(function () {
				data.message += $(this).text() + ' ' + $(this).find('input').val() + ' ' + '\r\n'
			})
		}
	}

	$('[data-file]').each(function () {
		data.files.push($(this).attr('data-file'))
	})
	return data
}

function prepareZip() {
	let data = preparePostData()
	launcher.calculateSize(data['files'],
		getGameLogsFreshnessSec(),
		getGameLogsSizeLimit(),
		$('[data-add-launcher-logs]').is(':checked')
	).then(function (result) {
		let bytes = parseInt(result)
		if(bytes >= 0) {
			renderBugReportBytes(bytes)
			if (bytes > window.supportConfiguration.postMaxSize) {
				$('#page .foot .size_info').addClass('error')
			} else {
				$('#page .foot .size_info').removeClass('error')
			}
		}
		validateForm()
	})
	return data
}

function renderBugReportBytes(bytes) {
	try {
		if (bytes < 1048576) { //KB
			$('#size_info_current').text((bytes / 1024).toFixed(0))
			$('#size_info_current + .dimension').text(i18next.t("KB"))
		} else { //MB
			$('#size_info_current').text((bytes / 1048576).toFixed(0))
			$('#size_info_current + .dimension').text(i18next.t("MB"))
		}
		let percent = bytes * 100 / window.supportConfiguration.postMaxSize
		if (percent > 100) {
			percent = 100
		}
		drawProgressBarValue(percent, $('[progress-bar]'))
	} catch (e) {
		console.log(e)
	}
}

function initLegacyTicketForm(supportCategories) {
	$('#bug_category').html('<option></option>')
	$('#bug_category').select2({
		...window.s2opt,
		'placeholder': '',
		'data': supportCategories.map((category) => {
			return {id: category.id || category.category_id, text: category.name}
		})
	}).removeClass('hidden').parent().removeClass('hidden')
	$('[data-default-form]').removeClass('hidden')
	$('#bug_category').on('change', async function (e) {
		let ticketFormTemplate = await generateTicketFormCallback(),
			formContainer = $('.legacy-ticket-container')
		formContainer.html(ticketFormTemplate)
		window.selectedCatId = parseInt($(this).val())
		window.selectedCat = window.supportConfiguration.categories.find(cat => cat.id === window.selectedCatId)
		let inputDefaults = window.selectedCat && window.selectedCat.inputTexts ? window.selectedCat.inputTexts : []
		window.stepInputDefaults = inputDefaults && inputDefaults.step ? inputDefaults.step : ''

		prepareZip()

		$('#bug_text').val('').attr('placeholder', inputDefaults && inputDefaults.text && inputDefaults.text[0] ? inputDefaults.text[0] : '')
		if (window.selectedCatId) {
			formContainer.removeClass('hidden')
			initSteps()
		}
		if (window.selectedCat && parseInt(window.selectedCat.clientLogsRequired)) {
			$('[data-add-client-logs]').prop('checked', true).attr('disabled', 'disabled')
		} else {
			$('[data-add-client-logs]').prop('checked', true).removeAttr('disabled', 'disabled')
		}
		if (window.selectedCat && parseInt(window.selectedCat.launcherLogsRequired)) {
			$('[data-add-launcher-logs]').prop('checked', true).attr('disabled', 'disabled')
		} else {
			$('[data-add-launcher-logs]').prop('checked', true).removeAttr('disabled', 'disabled')
		}

		$('#bug_text').on('keyup change paste', function (e) {
			validateForm()
			let textareaValue = $(this).val()
			formContainer.find('.js-bsg-support-ticket-node-length').text(textareaValue.length)
		})

		formContainer.localize()
	})
	$('#submit').on('click', function () {
		let data = prepareZip(),
			checkForMessageInput = $('#bug_text').length
		if (checkForMessageInput && 0 >= data.message.length) {
			try {
				launcher.showError(i18next.t("Field \"Describe your problem\" can not be empty"))
			} catch (e) {
				console.log(e)
			}
		} else if (checkForMessageInput && 2000 < data?.message.length) {
			try {
				launcher.showError(i18next.t("Field \"Describe your problem\" is too long"))
			} catch (e) {
				console.log(e)
			}
		} else {
			launcher.sendBugReport(
				data.category+'',
				data?.message,
				data.files,
				getGameLogsFreshnessSec(),
				getGameLogsSizeLimit(),
				$('[data-add-launcher-logs]').is(':checked'),
				$('#collectInfoCheckbox').is(':checked'),
				data?.poolsData,
				data?.themeId
			)
		}
	})
}
