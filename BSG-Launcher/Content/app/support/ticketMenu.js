async function initSupportTicketMenu(
	fetchDataCallback,
	fetchArticleCallback,
	initFilesDropCallback,
	ticketValidateCallback,
	generateTicketFormCallback,
	customSubmitFormHandle,
	onAfterNextAction,
	onAfterPollStep
) {

	const TICKET_TEXTAREA_MINLENGTH = 5
	const TICKET_TEXTAREA_MAXLENGTH = 1500
	const POOL_TEXTAREA_MINLENGTH = 5
	const POOL_TEXTAREA_MAXLENGTH = 500

	let supportTicketMenu = {}
	let supportTicketMenuTranslates = {}

	let categoryId = null
	let themeId = null

	let stepsHistory = []

	let poolLength = 0
	let poolActiveStep = 0

	let countdownTimerMilliseconds = 5000
	let sendButtonTimeout = null;
	let sendButtonInterval = null;

	let isPollsTimerStarted = false;

	let initDropFiles = () => {

		$("#files_drop").change(function (event) {
			var file_names = [];
			var ins = document.getElementById("files_drop").files.length;
			if(5<ins) {ins=5;}
			if(0<ins) {
				$("#files_label").removeClass("hidden");
				for (var x = 0; x < ins; x++) {
					file_names.push(document.getElementById("files_drop").files[x].name);
				}
				$("#uploaded").html("");
				$("#uploaded").html(file_names.join("<br/>"));
			} else {
				$("#uploaded").html("");
				$("#files_label").addClass("hidden");
			}
		});

	}
	if(typeof initFilesDropCallback === 'function') {
		initDropFiles = initFilesDropCallback;
	}

	let startSendButtonTimer = (buttonElement, buttonText = 'Send') => {

		clearTimeout(sendButtonTimeout);
		clearInterval(sendButtonInterval);

		let countdown = countdownTimerMilliseconds / 1000;
		buttonElement.prop('disabled', true)
		buttonElement.text('00:0' + countdown)

		sendButtonInterval = setInterval(function () {
			countdown = countdown - 1;
			if (countdown > 0) {
				buttonElement.text('00:0' + countdown)
			}
		}, 1000);

		sendButtonTimeout = setTimeout(
			function () {
				buttonElement.prop('disabled', false)
				buttonElement.text(buttonText)
				clearInterval(sendButtonInterval);
				clearTimeout(sendButtonTimeout);
			}, countdownTimerMilliseconds);

	}

	const pollValidate = (pollIndex) => {

		let sendButton = $('#support_ticket_menu').find('.js-bsg-form-button')

		let nextButtonElement = $('.js-bsg-support-ticket-menu-pool-button[data-type=next]')

		let validateState = false

		let activePoll = $('.bsg-support__pool[data-pool-step=' + pollIndex + ']')

		let isRequired = activePoll.data('poll-required');
		let activePollType = activePoll.data('pool-type');

		if (isRequired) {

			if (activePollType === 'text') {
				let value = activePoll.find('textarea').val()

				if (value.length >= POOL_TEXTAREA_MINLENGTH && value.length <= POOL_TEXTAREA_MAXLENGTH) {
					validateState = true
				}
			} else if (activePollType === 'checkbox') {
				let values = [];
				$(activePoll).find('input:checked').each(function() {
					values.push($(this).data('title'));
				});

				if (values.length > 0) {
					validateState = true
				}
			} else if (activePollType === 'radio') {

				let value = $(activePoll).find('input:checked').data('title')

				if (value) {
					validateState = true
				}

			} else if (activePollType === 'file') {

				let value = $(activePoll).find('#files_drop').val()

				if (value) {
					validateState = true
				}

			}

			if (poolLength === pollIndex + 1) {

				nextButtonElement.prop('disabled', true);

				if (validateState) {
					nextButtonElement.addClass('hidden')

					//тут кнопка отправки становится активной (можно запустить таймер)
					sendButton.removeClass('hidden');

					if (!isPollsTimerStarted) {
						isPollsTimerStarted = true
						startSendButtonTimer(sendButton, supportTicketMenuTranslates.ticketSendButtonTitle);
					}

				} else {
					isPollsTimerStarted = false
					nextButtonElement.removeClass('hidden')
					sendButton.prop('disabled', true).addClass('hidden');
				}

			} else {

				isPollsTimerStarted = false

				sendButton.prop('disabled', true).addClass('hidden');

				if (validateState) {
					nextButtonElement.prop('disabled', false).removeClass('hidden');
				} else {
					nextButtonElement.prop('disabled', true);
				}
			}

		} else {

			if (poolLength === pollIndex + 1) {
				//тут кнопка отправки становится активной (можно запустить таймер)
				sendButton.removeClass('hidden');

				if (!isPollsTimerStarted) {
					isPollsTimerStarted = true
					startSendButtonTimer(sendButton, supportTicketMenuTranslates.ticketSendButtonTitle);
				}
				nextButtonElement.prop('disabled', true).addClass('hidden');
			} else {
				isPollsTimerStarted = false
				sendButton.prop('disabled', true).addClass('hidden');
				nextButtonElement.prop('disabled', false).removeClass('hidden');
			}

		}

		if (activePollType === 'text') {
			activePoll.each(function () {
				let value = $(this).find('textarea').val()
				$(this).find('.js-bsg-support-ticket-node-length').text(value.length)
			})
		}
	}
	let ticketValidate = () => {

		let validate = false;

		let ticketNode = $('.js-bsg-support-ticket-node');

		let textareaValue = ticketNode.find('textarea').val()
		let formButton = ticketNode.find('.js-bsg-form-button')

		if (textareaValue.length >= TICKET_TEXTAREA_MINLENGTH && textareaValue.length <= TICKET_TEXTAREA_MAXLENGTH) {
			validate = true
		} else {
			validate = false
		}

		$(ticketNode).find('.js-bsg-support-ticket-node-length').text(textareaValue.length)

		if(validate) {
			formButton.prop('disabled', false)
		} else {
			formButton.prop('disabled', true)
		}
	}
	if(typeof ticketValidateCallback === 'function') {
		ticketValidate = ticketValidateCallback;
	}

	Object.byStringCustom = function(o, s) {
		s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
		s = s.replace(/^\./, '');           // strip a leading dot
		var a = s.split('.');
		for (var i = 0, n = a.length; i < n; ++i) {
			var k = a[i];
			if (k in o) {
				o = o[k];
			} else {
				return;
			}
		}
		return o;
	}

	const generateSelectNode = (data, nextStep, nextNode = null) => {

		let values = data.map(function (item, index){

			if (item.categoryId) {
				return `<option value="${index}">${item.categoryTitle}</option>`
			}

			return `<option value="${index}">${item.title}</option>`
		}).join('')

		let title = nextNode?.question?.title ?? ''

		if (title) {
			title = `<div class="bsg-support-ticket-menu-select-title">${title}</div>`
		}

		if (!nextNode) {
			title = `<div class="bsg-support-ticket-menu-select-title">${supportTicketMenuTranslates.siteSupportChooseCategory}</div>`
		}

		return `
			<div class="js-bsg-support-ticket-menu-step" data-step="${nextStep}">
				${title}
				<select style="margin-bottom: 20px" name="category" class="inlinetop js-bsg-support-ticket-menu-select2" data-placeholder="${supportTicketMenuTranslates.siteSupportChooseSelectPlaceholder}">
					<option></option>
					${values}
				</select>
            </div>
		`
	}

	const generateArticleNode = async (articleId, nextStep) => {

		let article = await fetchArticle(articleId)

		if (article) {

			return `
			<div style="margin-top: 20px; margin-bottom: 20px" class="js-bsg-support-ticket-menu-element" data-step="${nextStep}">

			<h3 style="margin-bottom: 30px;">${article.subject}</h3>

			${article.text}

			<div style="display: flex; justify-content: center">

				<button disabled class="button shadow bsg-support-ticket-menu-pool-button js-bsg-support-ticket-menu-article-link">
				</button>

			</div>

			</div>
		`

		}

	}

	const generatePollNode = (data, nextStep) => {

		poolLength = data.length

		let poolTemplate = ''

		data.map(function (pool, index) {

			let required = pool.required === true

			let requiredText = required ? `<div class="bsg-support-ticket-menu__polls-steps-required-title">${supportTicketMenuTranslates.pollStepRequiredTitle}</div>` : ''

			if (pool.dataType === 'checkboxes') {

				let checkboxes = pool.variants.map(function (checkbox, index2) {
					return `
						<div class="" style="position: relative; margin: 20px 0">
						<input id="${'pool-checkbox-' + index + '-' + index2}" class="form-checkbox hidden bsg-support-pool-checkbox" type="checkbox" value="1" data-title="${checkbox.checkboxTitle}">
							<label for="${'pool-checkbox-' + index + '-' + index2}" class="option bsg-support__checkbox"></label>
							<div style="margin-left: 35px">${checkbox.checkboxTitle}</div>
						</div>
					`
				}).join('')

				let template = `<div class="bsg-support__pool hidden" style="min-height: 280px" data-poll-required="${required}" data-pool-type="checkbox" data-pool-step="${index}">${requiredText}<label class="js-bsg-main-label bsg-support-ticket-menu__polls-title" for="text">${pool.poolTitle}</label><div>`
				template += checkboxes
				template += '</div></div>'

				poolTemplate += template

			} else if (pool.dataType === 'radio') {

				let radio = pool.variants.map(function (radio, index2) {
					return `
						<div class="" style="position: relative; margin: 20px 0;">

							<div class="radio">
								<input class="bsg-support__input" id="bsg-support-menu-radio-${index2}-${index}" data-title="${radio.radioTitle}" name="bsg-radio-group-${index}" type="radio">
								<label for="bsg-support-menu-radio-${index2}-${index}" class="radio-label">${radio.radioTitle}</label>
							  </div>

						</div>
					`
				}).join('')

				let template = `<div class="bsg-support__pool hidden" style="min-height: 280px" data-poll-required="${required}" data-pool-type="radio" data-pool-step="${index}">${requiredText}<label class="js-bsg-main-label bsg-support-ticket-menu__polls-title" for="text">${pool.poolTitle}</label><div>`
				template += radio
				template += '</div></div>'

				poolTemplate += template

			} else if (pool.dataType === 'file') {

				let fileTemplate = `
					<div style="display: flex; align-items: center; flex-direction: column">

					<div class="notice drop">

						<div class="container">

							<div class="form-item">
								<label for="files_drop">${supportTicketMenuTranslates.ticketFileDropTitle1}<br>${supportTicketMenuTranslates.ticketFileDropTitle2}</label>
								<input multiple="multiple" id="files_drop" name="files_drop" class="form-file" size="40" type="file">
							</div>

							<div class="form_note">${supportTicketMenuTranslates.ticketFileDropLimit}</div>
							<p id="files_label" class="center hidden">Прикрепленные файлы:</p>
							<ul id="uploaded"></ul>

						</div>
					</div>

				</div>
				`

				let template = `<div class="bsg-support__pool hidden" style="min-height: 280px" data-poll-required="${required}" data-pool-type="file" data-pool-step="${index}">${requiredText}<label class="js-bsg-main-label bsg-support-ticket-menu__polls-title" for="text">${pool.poolTitle}</label><div>`
				template += fileTemplate
				template += '</div></div>'

				poolTemplate += template


			} else {

				let template = `<div class="bsg-support__pool hidden" style="min-height: 280px" data-poll-required="${required}" data-pool-type="text" data-pool-step="${index}">${requiredText}<div style="display: flex;justify-content: space-between;align-items: center;"><label class="js-bsg-main-label bsg-support-ticket-menu__polls-title" for="text_${index}">${pool.poolTitle}</label><div style="width: 110px; text-align: right; color: #686869"><span class="js-bsg-support-ticket-node-length">0</span>/<span>` + POOL_TEXTAREA_MAXLENGTH + `</span></div></div><div>`
				template += `
					<textarea style="width: 100%;"
					maxlength="` + POOL_TEXTAREA_MAXLENGTH + `" data-main="text" id="text_${index}" name="text_${index}" class="form-textarea" cols="40" rows="9" placeholder=""></textarea>
				`
				template += '</div></div>'

				poolTemplate += template

			}

		})

		let prevButtonTemplate = `<button disabled href="#" data-type="prev" class="button shadow js-bsg-support-ticket-menu-pool-button bsg-support-ticket-menu-pool-button">${supportTicketMenuTranslates.pollStepButtonPrev}</button>`,
			nextButtonTemplate = `<button disabled href="#" data-type="next" class="button shadow js-bsg-support-ticket-menu-pool-button bsg-support-ticket-menu-pool-button">${supportTicketMenuTranslates.pollStepButtonNext}</button>`;

		if($('js-bsg-support-ticket-menu-pool-button[data-type="prev"]').length) {
			prevButtonTemplate = '';
		}
		if($('js-bsg-support-ticket-menu-pool-button[data-type="next"]').length) {
			nextButtonTemplate = '';
		}

		return `
			<div style="margin-top: 20px; margin-bottom: 20px" class="js-bsg-support-ticket-menu-element" data-step="${nextStep}">

				<div>
					<div class="bsg-support-ticket-menu__polls-steps-title" style="display: flex">
					${supportTicketMenuTranslates.pollStepTitle}&nbsp;<div class="js-bsg-support-ticket-menu-pool-step">${poolActiveStep + 1}</div>/<div class="js-bsg-support-ticket-menu-pool-all-steps">${poolLength}</div>
					</div>
				</div>

				<div style="margin-top: 15px">
					${poolTemplate}
				</div>

				<div style="">

				<div style="margin-top: 30px;display: flex;justify-content: space-between;">

                    ${prevButtonTemplate}
                    ${nextButtonTemplate}

					<button disabled id="submit" data-type="submit" class="button shadow bsg-support-ticket-menu-pool-button js-bsg-form-button hidden" name="submit" type="submit">
						${supportTicketMenuTranslates.ticketSendButtonTitle}
					</button>
				</div>

				</div>

            </div>
		`
	}

	let generateTextNode = async (data, nextStep) => {
		return `
			<div style="margin-top: 20px; margin-bottom: 20px" class="js-bsg-support-ticket-menu-element js-bsg-support-ticket-node" data-step="${nextStep}">

				<div class="container" style="display: flex; align-items: center; flex-direction: column">
<!--					<div style="width: 70px; height: 70px; background: url('/themes/eft/images/form_logo.png'); background-size: contain; background-repeat: no-repeat"></div>-->
<!--					<div class="form_head">${supportTicketMenuTranslates.createTicketTitle}</div>-->
				</div>

				<div style="">

					<div style="display: flex;justify-content: space-between;">
						<label class="bsg-support-ticket-menu__text-title" for="text">${supportTicketMenuTranslates.ticketTextTitle}*</label>
						<div style="width: 110px; text-align: right; color: #686869"><span class="js-bsg-support-ticket-node-length">0</span>/<span>` + TICKET_TEXTAREA_MAXLENGTH + `</span></div>
					</div>

					<textarea style="width: 100%;"
					maxlength="` + TICKET_TEXTAREA_MAXLENGTH + `" data-main="text" id="text" name="text" class="form-textarea" cols="40" rows="9" placeholder=""></textarea>
				</div>

				<div style="display: flex; align-items: center; flex-direction: column">

					<div class="notice drop"><div class="container"><div class="form-item"><label for="files_drop">${supportTicketMenuTranslates.ticketFileDropTitle1},<br>${supportTicketMenuTranslates.ticketFileDropTitle2}</label><input multiple="multiple" id="files_drop" name="files_drop" class="form-file" size="40" type="file"></div><div class="form_note">${supportTicketMenuTranslates.ticketFileDropLimit}</div><p id="files_label" class="center hidden">Прикрепленные файлы:</p><ul id="uploaded"></ul></div></div>

					<div class="form-item">

                        <button style="margin-top: 20px" disabled id="submit" class="js-bsg-form-button button shadow bsg-support-ticket-menu-pool-button" name="submit" type="submit">
                            ${supportTicketMenuTranslates.ticketSendButtonTitle}
                        </button>

					</div>

				</div>

            </div>
		`
	}
	if(typeof generateTicketFormCallback === 'function') {
		generateTextNode = generateTicketFormCallback;
	}

	const createStepPath = (step, selectedValue) => {

		if (stepsHistory.length > 0) {

			let pathsArray = stepsHistory.map(function(item) {
				return item['stepPath'];
			});

			return pathsArray.join('.')
		}

		return `categories[${selectedValue}]`;
	}

	const nextStepAction = async (step, selectedValue, forceCreateTicket = false) => {

		$('.js-bsg-support-ticket-menu-element').filter(function() {
			return $(this).data("step") > step;
		}).remove()

		$('.js-bsg-support-ticket-menu-errors').empty()

		let nextStep = parseInt(step) + 1,
			nextNode = null

		if (stepsHistory.length > step) {

			//удаляем шаги
			stepsHistory = stepsHistory.slice(0, step)

			let stepsElements = $('.js-bsg-support-ticket-menu-step').filter(function() {
				return $(this).data("step") > step;
			})

			stepsElements.find('.js-bsg-support-ticket-menu-select2').select2('destroy').remove()
			stepsElements.remove();

		}

		if (stepsHistory.length === step) {

			//добавляем шаг
			let stepPathOld = createStepPath(step, selectedValue)
			let stepPathFull = stepPathOld
			let stepPathNext = stepPathOld

			let oldNode = Object.byStringCustom(supportTicketMenu, stepPathOld)

			if ('categoryId' in oldNode) {
				categoryId = oldNode.categoryId
			}

			if (oldNode.question) {

				if (step > 0) {
					stepPathNext = `question.answers[${selectedValue}]`
					stepPathFull = stepPathOld + '.' + stepPathNext
				}

			}

			nextNode = Object.byStringCustom(supportTicketMenu, stepPathFull)
			nextNode = JSON.parse(JSON.stringify(nextNode))

			if ('themeId' in nextNode) {
				themeId = nextNode.themeId
			}

			if (nextNode.articleId && forceCreateTicket) {
				delete nextNode.articleId;
			}

			if (nextNode.question) {

				let selectData = generateSelectNode(nextNode.question.answers, nextStep, nextNode)

				$(".js-bsg-support-ticket-menu-container").last().append(`${selectData}`);

				$('.js-bsg-support-ticket-menu-select2').select2({
					minimumResultsForSearch: -1,
					language: $('html').attr('lang')
				});

				//сохраняем шаг в историю
				let history = {
					'step': step,
					'stepPath': stepPathNext,
					'value': selectedValue,
					'type': 'question'
				}

				stepsHistory.push(history)

			} else {
				if (nextNode.polls) {

					poolLength = 0
					poolActiveStep = 0

					let poll = generatePollNode(nextNode.polls, nextStep)
					$(".js-bsg-support-ticket-menu-container-elements").append(`${poll}`);

					initDropFiles()

					pollValidate(poolActiveStep)

					$(".bsg-support__pool").first().removeClass('hidden')

					$(".bsg-support__pool").on('keyup change paste', 'input, select, textarea', function(){
						pollValidate(poolActiveStep)
					});

					$('.js-bsg-support-ticket-menu-pool-button').off('click').on('click', function (element){
						element.preventDefault();

						let btn = $(element.target)

						if (btn.data('type') === 'next') {

							let poolNextStep = poolActiveStep + 1

							if ((poolLength - 1) >= poolNextStep) {
								$('.bsg-support__pool').filter(function (){
									return $(this).data("pool-step") !== poolNextStep;
								}).addClass('hidden')

								$('.bsg-support__pool').filter(function (){
									return $(this).data("pool-step") === poolNextStep;
								}).removeClass('hidden')

								poolActiveStep = poolActiveStep + 1

								$('.js-bsg-support-ticket-menu-pool-step').html(poolActiveStep + 1)

								$('.js-bsg-support-ticket-menu-pool-button[data-type=prev]').prop('disabled', false);

								// pollValidate(poolActiveStep)
							}

						} else if (btn.data('type') === 'prev') {

							let poolNextStep = poolActiveStep - 1

							if (poolNextStep < 0) {
								poolNextStep = 0
							}

							if ((poolLength - 1) >= poolNextStep) {

								$('.bsg-support__pool').filter(function (){
									return $(this).data("pool-step") !== poolNextStep;
								}).addClass('hidden')

								$('.bsg-support__pool').filter(function (){
									return $(this).data("pool-step") === poolNextStep;
								}).removeClass('hidden')

								poolActiveStep = poolActiveStep - 1

								if (poolActiveStep < 0) {
									poolActiveStep = 0
								}

								$('.js-bsg-support-ticket-menu-pool-step').html(poolActiveStep + 1)

								if (poolActiveStep === 0) {
									$('.js-bsg-support-ticket-menu-pool-button[data-type=prev]').prop('disabled', true);
								}


							}
						}

						pollValidate(poolActiveStep)

						if(typeof onAfterPollStep === 'function') {
							onAfterPollStep({
								btn: btn || null,
								stepsHistory: stepsHistory || null,
								pool: nextNode.polls[poolActiveStep] || null,
								poolStep: poolActiveStep || null,
								poolLength: poolLength || null
							})
						}
					})
				}
				else if (nextNode.articleId) {

					let article = await generateArticleNode(nextNode.articleId, nextStep)
					$(".js-bsg-support-ticket-menu-container-elements").append(`${article}`);

					let articleLink = $('.js-bsg-support-ticket-menu-article-link');

					$(articleLink).off('click').on("click", function(event){
						if ($(this).is("[disabled]")) {
							event.preventDefault();
							return false;
						}

						nextStepAction(step, selectedValue, true)

						event.preventDefault();
						return false;
					});

					startSendButtonTimer(articleLink, supportTicketMenuTranslates.ticketArticleDidntHelpButton)

				} else {
					let text = await generateTextNode([], nextStep)
					$(".js-bsg-support-ticket-menu-container-elements").append(`${text}`);

					$(".js-bsg-support-ticket-node").on('keyup change paste', 'textarea', function(){
						ticketValidate()
					});

					initDropFiles()
				}
			}

		}

		if(typeof onAfterNextAction === 'function') {
			onAfterNextAction({
				nextNode: nextNode || null,
				categoryId: categoryId || null,
				themeId: themeId || null,
				stepsHistory: stepsHistory || null,
				poolLength: poolLength || null,
				poolActiveStep: poolActiveStep || null
			})
		}

	}

	let fetchArticle = async (articleId) => {
		let result = await $.ajax({
			type: 'GET',
			url: '/support/knowledge/' + articleId,
			xhrFields: {withCredentials: true},
		});

		return await JSON.parse(result)
	}
	if(typeof fetchArticleCallback === 'function') {
		fetchArticle = fetchArticleCallback;
	}

	let fetchData = async () => {
		try {
			let result = await $.ajax({
				type: 'GET',
				url: '/support/contact/get-ticket-menu',
				xhrFields: {withCredentials: true},
			});

			return result
		} catch (e) {
			console.log('error: ' + e.error().status)
		}
	}
	if(typeof fetchDataCallback === 'function') {
		fetchData = fetchDataCallback;
	}

	let initSubmitFormHandle = () => {
		//обработчик для кнопки "отправить" тикет
		$('#support_ticket_menu_search').submit(function(e) {
			e.preventDefault();

			if (!categoryId) {
				return false;
			}

			let data = new FormData();

			let token = $(this).find('#token').val()
			let formId = $(this).find('#form_id').val()
			let ticketText = $(this).find('#text').val() ?? ''
			let poolsDataString = ''

			$('.js-bsg-support-ticket-menu-errors').empty()

			//собираем данные с опросника, если он есть
			let pools = $('.bsg-support__pool')
			console.log('pools')
			console.log(pools)
			if (pools.length) {

				let poolsData = []

				pools.map(function (i, pool) {

					let label = $(pool).find('label.js-bsg-main-label').text();
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

							let values = [];
							$(pool).find('input:checked').each(function() {
								values.push($(this).data('title'));
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
			}

			console.log('poolsDataString')
			console.log(poolsDataString)

			if (pools.length && poolsDataString) {
				data.append("poolsData", poolsDataString)
			}

			data.append("token", token)
			data.append("form_id", formId)
			data.append("text", ticketText)

			if (themeId) {
				data.append("themeId", themeId)
			}

			if (document.getElementById("files_drop")) {
				let ins = document.getElementById("files_drop").files.length;
				if(5<ins) {ins=5;}
				for (var x = 0; x < ins; x++) {
					data.set("file_"+(x+1), document.getElementById("files_drop").files[x], document.getElementById("files_drop").files[x].name);
				}
				data.delete("files_drop");
			}

			let button = $(this).find('.bsg-form-button')
			button.find('.js-bsg-form-button-text').addClass('hidden')
			button.find('.js-bsg-form-button-animation').removeClass('hidden')

			//отправляем запрос на бекенд
			$.ajax({
				type: "POST",
				method: 'POST',
				url: $("#support_ticket_menu_search").attr("action") + categoryId,
				processData: false, // important
				contentType: false, // important
				cache: false,
				data: data,
				complete: function () {
					button.find('.js-bsg-form-button-text').removeClass('hidden')
					button.find('.js-bsg-form-button-animation').addClass('hidden')
				},
				success: function (result, textStatus, xhr) {

					if (xhr.status === 200) {

						let isJson = false
						let json = {}

						try {
							json = JSON.parse(result);
							isJson = true
						} catch (e) {
							isJson = false
						}

						if (isJson && 'errors' in json) {

							let errorsString = ''

							Object.keys(json.errors).forEach(function (key, index) {
								errorsString += `<p>${json.errors[key]}</p>`
							});

							$(".js-bsg-support-ticket-menu-errors").append(errorsString);


						} else {
							if ('success' in json && json.success === true) {
								$('#support_ticket_menu').remove();
								$('#support_ticket_menu_success').removeClass('hidden')
							}
						}

					}

				},
				error: function (e) {

					console.log("ERROR : ", e);
					let errorText = "<p>ERROR : " + e.status + ' ' + e.statusText + "</p>"
					$(".js-bsg-support-ticket-menu-errors").append(errorText);

					button.find('.js-bsg-form-button-text').removeClass('hidden')
					button.find('.js-bsg-form-button-animation').addClass('hidden')

				}
			});

		});
	}
	if(typeof customSubmitFormHandle === 'function') {
		initSubmitFormHandle = customSubmitFormHandle;
	}

	let resultJson = await fetchData();
	supportTicketMenu['categories'] = resultJson?.categories;
	supportTicketMenuTranslates = resultJson?.translates;

	if (supportTicketMenu) {

		$('body').addClass('bsg-scrollbar-visible');

		initSubmitFormHandle();

		//вешаем обработчик на контейнер для событий изменения select
		$('.js-bsg-support-ticket-menu-container').on('select2:select', function (event) {
			let selectedValue = $(event.target).val();
			let step = $(event.target).parent().data('step');

			nextStepAction(step, selectedValue)
		});

		//генерируем первый html для select
		let selectData = generateSelectNode(supportTicketMenu.categories, 0)

		//добавляем первый select в dom
		$(".js-bsg-support-ticket-menu-container").last().append(`${selectData}`);

		//инициализируем плагин select2
		$('.js-bsg-support-ticket-menu-select2').select2({
			minimumResultsForSearch: -1,
			language: $('html').attr('lang')
		});

	}

}
