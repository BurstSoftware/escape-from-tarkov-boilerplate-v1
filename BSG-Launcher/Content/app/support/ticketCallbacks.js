async function fetchDataCallback() {
	return window.supportConfiguration.menu
}

function fetchArticleCallback(id) {
	$('[data-article-website-link]').attr('href', '#')
	return new Promise((resolve, reject) => {
		ApiWebsite.getSupportKnowledge(id, function (response) {
			let knowledge = ApiWebsite.supportKnowledgeModel().readResponse(response)
			if(knowledge?.link) {
				$('[data-article-website-link]').attr('href', knowledge.link)
			}
			resolve( knowledge )
		}, function (e) {
			console.error(e)
			reject( ApiWebsite.supportKnowledgeModel().readResponse({}) )
		})
	})
}

async function initFilesInputCallback() {
	let template = await getTemplate('support/ticket_files_form.html')

	$('.js-bsg-support-ticket-node .notice.drop').parent().html(template)
	$('[data-pool-type="file"]').each(function () {
		if($(this).find('.notice.drop').length) {
			$(this).find('.js-bsg-main-label + div').html(template)
		}
	})
	$('.js-bsg-support-ticket-menu-container-elements').localize()

	prepareZip()
}

function revalidateFileNotEmpty() {
	let activePoll = $('.bsg-support__pool:not(.hidden)'),
		isRequired = activePoll.data('poll-required'),
		activePollType = activePoll.data('pool-type'),
		nextButton = $('#support_ticket_menu_search button.huge')

	if(isRequired && activePollType === 'file') {
		if($('[data-selected-files] [data-file]').length) {
			nextButton.prop('disabled', false)
		} else {
			nextButton.prop('disabled', true)
		}
	}
}

async function generateTicketFormCallback(data, nextStep) {
	let template = await getTemplate('support/ticket_create_form.html'),
		submitButtonTitle = window.supportConfiguration?.menu?.translates?.ticketSendButtonTitle || i18next.t("FeedbackSend"),
		filesDropTemplate = await getTemplate('support/ticket_files_form.html'),
		resultTemplate = template + filesDropTemplate

	resultTemplate = $('<div class="js-bsg-support-ticket-menu-element js-bsg-support-ticket-node" data-step="'+nextStep+'"/>')
		.html(resultTemplate).get(0).outerHTML

	$('#submit').text(submitButtonTitle)

	return resultTemplate
}

function onAfterPollStep(data) {
	if(window.environment !== 'Production') {
		console.warn(data)
	}

	if(data?.pool?.dataType === 'file') {
		revalidateFileNotEmpty()
		$(".bsg-support__pool").off('keyup change paste', '.attachedCheckbox>input').on('keyup change paste', '.attachedCheckbox>input', () => {
			revalidateFileNotEmpty()
		})
	}

	if(data?.btn.data('type') === 'prev' && data?.poolLength-1 === data?.poolStep + 1) {
		$('.js-bsg-support-ticket-menu-pool-button').removeClass('hidden')
	}
}

function onAfterNextAction(data) {
	if(window.environment !== 'Production') {
		console.warn(data)
	}

	window.themeId = data?.themeId
	window.selectedCatId = data?.categoryId

	$('[data-default-form]').addClass('hidden')
	$('[data-pool-form]').addClass('hidden')
	$('[data-article-form]').addClass('hidden')
	$('[data-files-drop-info]').addClass('hidden')

	if(data?.nextNode?.polls) {
		$('[data-files-drop-info]').removeClass('hidden')
		$('.js-bsg-support-ticket-menu-container-elements [data-type="prev"]').parent().remove()
		$('[data-pool-form]').removeClass('hidden')
	} else if(data?.nextNode?.articleId) {
		$('.js-bsg-support-ticket-menu-container-elements .js-bsg-support-ticket-menu-article-link').parent().remove()
		$('[data-type="articleDidNotHelped"]').html(window.supportConfiguration?.menu?.translates?.ticketArticleDidntHelpButton)
		$('[data-article-form]').removeClass('hidden')
	} else {
		$('[data-files-drop-info]').removeClass('hidden')
		$('[data-default-form]').removeClass('hidden')
		initSteps()
	}
}

function validateForm() {
	let category = window.selectedCatId,
		fileSize = $('#page .foot .size_info'),
		isValidFileSize = !fileSize.hasClass('error'),
		isValidText = false,
		ticketNode = $('.js-bsg-support-ticket-node'),
		textareaValue = ticketNode.find('textarea').val(),
		formButton = $('#submit')

	if (textareaValue && textareaValue.length >= 5 && textareaValue.length <= 1500) {
		isValidText = true
	}

	ticketNode.find('.js-bsg-support-ticket-node-length').text(textareaValue ? textareaValue.length : 0)

	if (!isValidText) {
		$('label[for="bug_text"]').addClass('error')
	} else {
		$('label[for="bug_text"]').removeClass('error')
	}

	if(category && isValidText && isValidFileSize) {
		formButton.prop('disabled', false)
	} else {
		formButton.prop('disabled', true)
	}
}

function submitTicketFormListener() {
	$('#support_ticket_menu_search').submit(function(e) {
		e.preventDefault();
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

function getSupportConfiguration() {
	ApiWebsite.getSupportConfig(window.settings.language, async function (response) {
		let data = ApiWebsite.supportConfigModel().readConfigResponse(response)
		if (window.environment !== 'Production') {
			console.log(data)
		}
		if (data) {
			window.supportConfiguration = data

			if (window.supportConfiguration.warning) {
				$('[data-support-warning]').html(window.supportConfiguration.warning)
			}

			if(window.supportConfiguration.menu) {
				await initSupportTicketMenu(
					fetchDataCallback,
					fetchArticleCallback,
					initFilesInputCallback,
					validateForm,
					generateTicketFormCallback,
					submitTicketFormListener,
					onAfterNextAction,
					onAfterPollStep,
				)
			} else {
				initLegacyTicketForm(window.supportConfiguration.categories)
			}

			if(window.supportConfiguration.postMaxSize && window.supportConfiguration.postMaxSize !== window.settings.maxBugReportSize) {
				launcher.setSettings(JSON.stringify({maxBugReportSize: window.supportConfiguration.postMaxSize ?? window.settings.maxBugReportSize}))
			}

			$('#size_info_limit').text(parseInt((window.supportConfiguration.postMaxSize ?? window.settings.maxBugReportSize) / 1048576 + ''))
		}
	})
}

function getGameLogsFreshnessSec() {
	return $('[data-add-client-logs]').is(':checked') && window.supportConfiguration.gameLogsFreshnessSec
		? window.supportConfiguration.gameLogsFreshnessSec : 0
}

function getGameLogsSizeLimit() {
	return $('[data-add-client-logs]').is(':checked') && window.supportConfiguration.gameLogsSizeLimit
		? window.supportConfiguration.gameLogsSizeLimit : 0
}

function getPollsDataString() {
	let poolsData = getPollsData(),
		poolsDataString = ''

	if(poolsData.length) {
		poolsData.map(function (poll){
			if (poll.label) {
				if (typeof poll.value === 'string' || typeof poll.value === 'number') {
					poolsDataString += poll.label + ':' + '\n'
					poolsDataString += poll.value + '\n'
					poolsDataString += '\n'
				} else if (Array.isArray(poll.value) && poll.value.length) {
					poolsDataString += poll.label + ':' + '\n'
					poolsDataString += poll.value.map(function (val, index){
						return index+1 + ') ' + val + '\n'
					}).join('')
					poolsDataString += '\n'
				}
			}
		})
	}

	return poolsDataString
}

function getPollsData(){
	let pools = $('.bsg-support__pool'),
		poolsData = []

	if (pools.length) {
		pools.map(function (i, pool) {
			let label = $(pool).find('label.js-bsg-main-label').text()
			let poolType = $(pool).data('pool-type')

			if(label && poolType) {

				if (poolType === 'text') {

					let value = $(pool).find('textarea').val()

					if (value) {
						poolsData.push({
							label,
							value
						})
					}


				} else if (poolType === 'checkbox') {

					let values = []
					$(pool).find('input:checked').each(function() {
						values.push($(this).data('title'))
					});

					if (values.length) {
						poolsData.push({
							label,
							value: values
						})
					}

				} else if (poolType === 'radio') {

					let value = $(pool).find('input:checked').data('title')

					if (value) {
						poolsData.push({
							label,
							value
						})
					}

				} else if (poolType === 'file') {

				}

			}
		})
	}
	return poolsData
}
