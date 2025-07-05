let stepInputDefaults = [],
	bugReportStepLimit = 15

function initSteps() {
	$('[data-step-add]').off('click').on('click', function () {
		if(!$(this).hasClass('disabled')) {
			let index = $('[data-step-list]').children().length,
				value = window.stepInputDefaults ? window.stepInputDefaults[index] : ''

			if(index < bugReportStepLimit) {
				addStep(index + 1, value)
			} else {
				$('[data-step-add]').addClass('disabled');
			}
		}
	})
}

function addStep(index, value) {
	let item = $('<div></div>', {class: 'step-item'}),
		labelText = '<span data-i18n="Step">' + i18next.t('Step') + '</span> <span class="wrap"><span data-index>' + index + '</span>:</span>',
		id = 'step_' + index,
		flexibleInput = $('<div></div>', {class: 'flexibleInput'}),
		background = $('<div></div>', {class: 'block background'}),
		input = $('<input/>', {type: 'text', id: id, placeholder: value})
	item.append($('<label for="' + id + '" class="inline">' + labelText + '</label>'))
	flexibleInput.append(input)
	background.append($('<div></div>', {class: 'left'}))
	background.append($('<div></div>', {class: 'middle'}))
	background.append($('<div></div>', {class: 'right'}))
	flexibleInput.append(background)
	item.append(flexibleInput)
	item.append($('<div class="button inline" data-step-remove><i class="icon exit"></i></div>'))
	$('[data-step-list]').append(item)
	$('[data-step-remove]').off('click').on('click', function () {
		removeStep($(this).parent())
	})
}

function removeStep($element) {
	$element.remove()
	reIndexStep()
	if($('[data-step-list]').children().length < bugReportStepLimit) {
		$('[data-step-add]').removeClass('disabled');
	}
}

function reIndexStep() {
	$('[data-step-list] [data-index]').each(function (i) {
		$(this).text(i + 1)
	})
}
