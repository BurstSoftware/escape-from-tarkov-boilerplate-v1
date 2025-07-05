let form = $('#FeedbackForm'),
	userChanged = false

$(document).ready(() => {
	whenAvailable('launcher', () => {
		try {
			whenJqueryFuncAvailable('localize', () => {
				$("body").localize()

				whenAvailable('game_version', () => {
					$('#FormVersionNote').html(window.game_version).promise().then(() => {
						$('#FormVersionNote').parent().hide().removeClass('hidden').fadeIn(window.fadeInSpeed)
					})
				})
			})

			$(document).off('click').on('click', '#feedback_page>.foot .button.huge', function (e) {
				e.preventDefault()
				if (!$(this).hasClass('disabled')) {
					try {
						let payload = $('#FeedbackForm').serializeJSON(window.serializeConf)
						ApiWebsite.saveFeedback(payload, () => {
							launcher.close()
						}, feedbackErrorCallback)
					} catch (e) {
						hideLoader()
						console.log(e)
					}
				}
			})

		} catch (e) {
			console.log(e)
		}
	})
})

function feedbackErrorCallback(httpCode, errorCode, errorArgs) {
	errorArgs = errorArgs ? JSON.parse(errorArgs) : errorArgs
	showCodeError(
		errorCode,
		"error_msg_" + errorCode,
		errorArgs
	)
}

function renderFeedbackForm(response) {
	try {
		if (null !== response) {
			launcher.getSettings().then((settings) => {
				settings = $.parseJSON(settings)
				window.lang = settings.language || 'en'
				window.settings = new Settings(settings)
				window.games = new Games()
				window.games.setList(settings?.games || [])
				window.game_version = games.getSelectedBranch()?.gameVersion

				let FeedbackClass = ApiWebsite.endpoint().feedback()
				window.CurrentFeedback = FeedbackClass.readResponse(response)

				if (window.CurrentFeedback) {
					renderFeedbackDate(window.CurrentFeedback.datecreated)
					initFeedbackForm()
				}
			})
		}
	} catch (e) {
		console.log(e)
	}
	hideLoader()
}

function renderFeedbackDate(datecreated) {
	try {
		if (datecreated && datecreated > 0) {
			$('#FormDateNote').html(moment.unix(datecreated).format('DD MMMM YYYY')).promise().then(() => {
				$('#FormDateNote').parent().hide().removeClass('hidden').fadeIn(window.fadeInSpeed)
			})
		}
	} catch (e) {
		console.log(e)
	}
}

function initFeedbackForm() {
	try {
		$('<input type="hidden" name="language" value="' + window.lang + '" />').appendTo(form)
		$.each(window.CurrentFeedback.questions, (i, question) => {
			let itemHtml = renderQuestion(i, question) + '<br>'
			$(itemHtml).appendTo(form)

			if (question.fieldType == 4) {
				$('select#question_' + question.id).html('<option></option>').select2({
					...window.s2opt,
					'placeholder': '',
					'data': question['answers'].map((answer) => {
						return {id: answer['id'], text: window.CurrentFeedback.getText(answer)}
					})
				}).removeClass('hidden')
			}
		})

		initStars()

		$('#FeedbackForm textarea, #FeedbackForm input[type="text"]').off('keyup').on('keyup', validateSubmit)
		$('#FeedbackForm [required]').off('click').on('click', validateSubmit)

		$('#FeedbackForm').on('change', () => {
			if (!userChanged) {
				userChanged = true
				$('#feedback_page>.foot .button.huge').removeClass('disabled')
			}
			validateSubmit()
		})
	} catch (e) {
		console.log(e)
	}
}

function validateSubmit() {
	let wholeFormValid = true,
		button = $('#feedback_page>.foot .button.huge')
	$('#FeedbackForm textarea, #FeedbackForm input[type="text"]').each(function (index) {
		let inputValid = true

		if ($(this).val().length < $(this).attr('minlength')) {
			inputValid = false
		}
		if ($(this).val().length > $(this).attr('maxlength')) {
			inputValid = false
		}
		if (inputValid) {
			$('label[for="' + $(this).attr('id') + '"]').removeClass('error')
			$(this).removeClass('error')
		} else {
			wholeFormValid = false
			$('label[for="' + $(this).attr('id') + '"]').addClass('error')
			$(this).addClass('error')
		}
	})
	$('#FeedbackForm [required]').each(function () {
		let empty = true,
			name = $(this).attr('name')
		switch ($(this).attr("type")) {
			case "checkbox":
				empty = $('[name="' + name + '"]').is(':checked')
				break
			case "radio":
				empty = $('[name="' + name + '"]').is(':checked')
				break
			default:
				empty = $(this).val().length
				break
		}
		if (empty) {
			$('label[for="' + $(this).attr('id') + '"]').removeClass('error')
			$(this).removeClass('error')
		} else {
			wholeFormValid = false
			$('label[for="' + $(this).attr('id') + '"]').addClass('error')
			$(this).addClass('error')
		}
	})

	if (wholeFormValid) {
		button.removeClass('disabled')
	} else {
		button.addClass('disabled')
	}
}

// $inputTypes = [
//     0 => 'text',
//     1 => 'textarea',
//     2 => 'radio',
//     3 => 'checkbox',
//     4 => 'select',
//     5 => 'stars',
// ]
// $answersRequired = [2, 3, 4]
function renderQuestion(i, question) {
	let inputRow = '',
		inputId = 'question_' + question.id,
		inputName = 'question_' + question.id,
		isRequired = '',
		labelId = 'label_' + question.id,
		values = [],
		textValue = '',
		label = '<label class="label" id="' + labelId + '" for="' + inputId + '">' + window.CurrentFeedback.getText(question) + '</label>',
		sLabel = '<span class="label" id="' + labelId + '">' + window.CurrentFeedback.getText(question) + '</span>'

	let questionValues = window.CurrentFeedback.getValues(question)
	if (questionValues && questionValues.length) {
		values = questionValues
		try {
			textValue = values[0]['answer']
		} catch (e) {
			console.log(e)
		}
	}

	if (question.isRequired) {
		isRequired = 'required'
		label = '<label class="label" id="' + labelId + '" for="' + inputId + '">' + window.CurrentFeedback.getText(question) + '*</label>'
		sLabel = '<span class="label" id="' + labelId + '">' + window.CurrentFeedback.getText(question) + '*</span>'
	}

	switch (parseInt(question.fieldType)) {
		//textarea
		case 1:
			inputRow = '<p class="textarea">' + label + '<textarea id="' + inputId + '" class="allow_selecting" name="' + inputName + '" minlength="' + window.feedbackTextAreaMinLen + '" maxlength="' + window.feedbackTextAreaMaxLen + '" ' + isRequired + '>' + textValue + '</textarea>' + '</p>'
			break
		//radio
		case 2:
			inputRow = '<p>' + sLabel + '</p>' + '<p class="radio">' + getRadioList(inputId, question['answers'], values, isRequired) + '</p>'
			break
		//checkbox
		case 3:
			inputRow = '<p>' + sLabel + '</p>' + '<p class="checkbox">' + getCheckboxList(inputId, question['answers'], values, isRequired) + '</p>'
			break
		//select2
		case 4:
			inputRow = '<p class="select2">' + label + getSelect2List(inputId, question['answers'], values, isRequired) + '</p>'
			break
		//stars
		case 5:
			inputRow = '<p>' + sLabel + '</p>' + '<p class="star">' + getStarsList(inputId, textValue, isRequired) + '</p>'
			break
		//text
		default:
			inputRow =
				'<p class="input">' +
				label +
				'<span class="flexibleInput">' +
				'<input class="allow_selecting" type="text" id="' + inputId + '" name="' + inputName + '" value="' + textValue + '" minlength="' + window.feedbackTextInputMinLen + '" maxlength="' + window.feedbackTextInputMaxLen + '" ' + isRequired + ' />' +
				'<span class="block background">' +
				'<span class="left"></span>' +
				'<span class="middle"></span>' +
				'<span class="right"></span>' +
				'</span>' +
				'</span>' +
				'</p>'
			break
	}

	return inputRow
}

function getRadioList(inputId, answers, values, isRequired) {
	let result = ''
	$.each(answers, function (i, v) {
		let value = v['id'],
			answerId = inputId + '_' + v['id'],
			attrSelected = '',
			label = '<label class="label" for="' + answerId + '">' + window.CurrentFeedback.getText(v) + '</label>'

		if (values.length > 0) {
			$.each(values, (index, selected) => {
				if (parseInt(value) === parseInt(selected.aid)) {
					attrSelected = 'checked="checked"'
				}
			})
		}

		result += '<input class="allow_selecting" type="radio" name="' + inputId + '" id="' + answerId + '" value="' + value + '" ' + attrSelected + ' ' + isRequired + ' />' + label
	})
	return result
}

function getStarsList(inputId, value, isRequired) {
	let result = '<input class="allow_selecting hidden" type="text" name="' + inputId + '" id="' + inputId + '" value="' + value + '" ' + isRequired + ' />',
		stars = ''

	for (let i = 1; i < 6; i++) {
		if (value >= i) {
			stars += '<span class="star_' + i + ' ratings_stars ratings_vote" data-value="' + i + '"></span>'
		} else {
			stars += '<span class="star_' + i + ' ratings_stars" data-value="' + i + '"></span>'
		}
	}
	let label = '<label for="' + inputId + '">' + stars + '</label>'
	return label + result
}

function initStars() {
	$(".ratings_stars").hover(
		// Handles the mouseOVER
		function () {
			$(this).prevAll().addBack().addClass("ratings_over")
		},
		// Handles the mouseOUT
		function () {
			$(this).prevAll().addBack().removeClass("ratings_over")
		}
	).hover()

	$(".ratings_stars").click(function (e) {
		let input = $(this).parent().parent().find('input')
		input.val($(this).attr("data-value")).change()
		$(this).nextAll().removeClass("ratings_vote")
		$(this).prevAll().addBack().addClass("ratings_vote")
	})
}

function getCheckboxList(inputId, answers, values, isRequired) {
	let result = ''
	$.each(answers, (i, v) => {
		let value = v['id'],
			answerId = inputId + '_' + v['id'],
			attrSelected = '',
			label = '<label class="label" for="' + answerId + '">' + window.CurrentFeedback.getText(v) + '</label>'

		if (values.length > 0) {
			$.each(values, (index, selected) => {
				if (parseInt(value) === parseInt(selected.aid)) {
					attrSelected = 'checked="checked"'
				}
			})
		}

		result += '<input class="allow_selecting" type="checkbox" name="' + inputId + '[]" id="' + answerId + '" value="' + value + '" ' + attrSelected + ' ' + isRequired + ' />' + label
	})
	return result
}

function getSelect2List(inputId, answers, values, isRequired) {
	return '<select id="' + inputId + '" class="hidden" name="' + inputId + '" ' + isRequired + '></select>'
}
