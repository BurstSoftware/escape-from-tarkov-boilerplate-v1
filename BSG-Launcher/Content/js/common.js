$(document).ready( function () {
	whenAvailable('launcher',function () {
		try {

			renderBackground('main')
			Blur("#head .background")

			$(document).on('click', '[data-news]', function() {
				if($(this).attr('data-news') !== 'null') {
					showNews($(this).attr('data-news'))
				}
			})

			head_user_block.click(function(e){
				if(user_menu.hasClass('hidden')) {
					user_menu.hide().removeClass('hidden').fadeIn(window.fadeInSpeed)
				} else {
					user_menu.fadeOut(window.fadeOutSpeed, function(e) {
						user_menu.addClass('hidden')
					})
				}
			})

			whenAvailable('siteConfig', () => {
				$(document).on('click', '[data-view-page]', changePage)
			})

			let gameClientSettings = $('[data-list-menu="gameClientSettings"]');
			gameClientSettings.click(function(e){
				gameClientSettings.fadeOut(window.fadeOutSpeed).removeClass('visible')
				$('[data-list-menu-open="gameClientSettings"]').removeClass('opened')
			})
			$("#head>.wrap>.menu>ul").click(function(e){
				if(mobile_menu.hasClass('hidden')) {
					mobile_menu.hide().removeClass('hidden').fadeIn(window.fadeInSpeed)
				} else {
					mobile_menu.fadeOut(window.fadeOutSpeed, function(e) {
						mobile_menu.addClass('hidden')
					})
				}
			})

			//Язык открыли и кликаем не в него язык закрывается
			$("html")[0].addEventListener('click', function(event) {
				if ($(event.target).closest('#head .user').length === 0) {
					user_menu.fadeOut(window.fadeOutSpeed, function(e) {
						user_menu.addClass('hidden')
					})
				}
				$('[data-list-menu]').each(function () {
					let menuKey = $(this).attr('data-list-menu')
					if ($(event.target).closest('[data-list-menu="'+menuKey+'"]').length === 0) {
						$(this).fadeOut(window.fadeOutSpeed, (e) => {
							$(this).removeClass('visible')
							$('[data-list-menu-open="'+menuKey+'"]').removeClass('opened')
						})
					}
				})
				if ($(event.target).closest('#head .menu>ul').length === 0) {
					mobile_menu.fadeOut(window.fadeOutSpeed, function(e) {
						mobile_menu.addClass('hidden')
					})
				}
				if ($(event.target).closest(
					'#news_item>.container>.sharing>.right>.sharer>i, ' +
					'#news_item>.container>.sharing>.right>.sharer>span'
				).length === 0) {
					$('#news_item>.container>.sharing>.right>.sharer>ul').fadeOut(window.fadeOutSpeed, function(e) {
						$('#news_item>.container>.sharing>.right>.sharer>ul').addClass('hidden')
					})
				}
			}, true)

			$(document).on('click', '[data-main-button]', function(e) {
				if($(this).hasClass('disabled')) {
					return false
				}

				let action = $(this).attr('data-main-button')
				GoToPage('/game/'+action)
				switch (action) {
					case "install":
						installGame()
						reachClickGoal('click_download_'+window.games.selectedGameName)
						break
					case "start":
						startGame()
						reachClickGoal('click_launch_'+window.games.selectedGameName)
						break
					case "update":
						let branch = window.games.getSelectedBranch()
						if(branch?.gameUpdateState !== 'pause') {
							updateGame(window.games.selectedGameName)
						} else {
							resumeInstallation(window.games.selectedGameName)
						}
						reachClickGoal('click_update_'+window.games.selectedGameName)
						break
					case "pause":
						pauseInstallation(window.games.selectedGameName)
						break
					case "buy":
						reachClickGoal('click_buy_'+window.games.selectedGameName)
						break
					case "repair":
						repairGame()
						break
					case "ingame":
						break
					case "inqueue":
						cancelGameQueue()
						break
					default:
					//Unknown state
				}
			})

			$(document).on('click', '[data-game-controls-download]', function(e) {
				GoToPage('/game/download')
				let clickedGameName = $(this).attr('data-game-controls-download'),
					game = window.games.getGame(clickedGameName),
					branch = game.getSelectedBranch()
				if(branch?.gameUpdateState !== 'pause') {
					updateGame(clickedGameName)
				} else {
					resumeInstallation(clickedGameName)
				}
				reachClickGoal('click_update_'+clickedGameName)
			})
			$(document).on('click', '[data-game-controls-pause]', function(e) {
				GoToPage('/game/pause')
				pauseInstallation($(this).attr('data-game-controls-pause'))
			})
			$(document).on('click', '[data-game-controls-suspend]', function(e) {
				GoToPage('/game/suspend')
				stopInstallation($(this).attr('data-game-controls-suspend'))
			})

			$('[data-game-select="'+window.settings.selectedGame+'"]').addClass('selected')
		} catch (e) {
			console.log(e)
		}
	})
})



/*LAUNCHER FUNCTIONS*/
function hideGameBlocks() {
	game_installer.addClass('hidden')
	game_main.addClass('hidden')
	top_button_check_updates.removeClass('blinking')
	top_button_check_updates.find('span').attr('data-i18n', 'Check for updates').html(i18next.t('Check for updates'))
	refreshSelectFolder()
	refreshFeedbackButton()
	refreshCheckForUpdate()
	refreshBranchSelectorState()
}

function resetGameBlock() {
	if(!playButtonForceLocked) {
		clearInterval(jsIntervals['playButtonLock'])
		delete jsIntervals['playButtonLock']
		game_main.find('[data-countdown]').remove()
		game_install_button.removeClass('disabled')
	}
	game_main.find('.block').removeClass('error')
	game_main.find('.reinstall_error').addClass('hidden')
	game_main.find('.game_queue').addClass('hidden')
	game_main.find('.reinstall_error .mes_3').attr('data-i18n', 'Complete reinstall required.')
	game_main.find('.game_info').removeClass('hidden')
	game_main.find('.game_info>.row').removeClass('hidden')
	game_main.find('[data-row-wait-for-start-of-testing]').addClass('hidden')
	game_main.find('.top_buttons').css({visibility: "visible"})
	game_main.find('[data-type="version"] .error').remove()
	game_main.find('[data-type="region"]').parent().removeClass('hidden')
	game_install_button.find('.main_text').html('<i class="icon install"></i><span data-i18n="Install"></span>')
	game_install_button.removeClass('patch').removeClass('disabled')
	if(typeof game_install_button.parent().attr('href') !== 'undefined') {
		game_install_button.unwrap()
	}
	top_button_select_folder.addClass('disabled')
	top_button_check_updates.addClass('disabled')
	top_button_check_updates.removeClass('blinking')
	top_button_check_updates.find('span').attr('data-i18n', 'Check for updates')
	whenJqueryFuncAvailable('localize',  function() {
		top_button_check_updates.localize()
	})
	refreshSelectFolder()
	refreshBranchSelectorState()
}

function drawMainButtonCountdown(sec, disableMainButton) {
	let addDisabledClass = disableMainButton || false
	if(sec>0) {
		if(addDisabledClass) {
			window.playButtonForceLocked = true
			game_install_button.addClass('disabled')
		}
		game_install_button
			.addClass('patch')
			.find('.main_text')
			.html('<div class="top"><span data-countdown>' + renderSeconds(sec) + '</span></div><i class="icon man"></i><span data-i18n="Play"></span>')
		$('#game_main').localize()
		new Countdown({
			uniqueKey: 'playButtonCountDown',
			seconds: sec-1,  // number of seconds to count down
			onUpdateStatus: function(sec){
				window.playButtonLockSeconds = sec
				game_install_button.find('.main_text [data-countdown]').html(renderSeconds(sec))
			}, // callback for each second
			onCounterEnd: function(){
				window.playButtonForceLocked = false
				window.playButtonLockSeconds = 0
				window.games.getSelectedBranch().gameState = "readyToGame"
				drawMainScreenGameState(window.games.getSelectedGame())
			} // final action
		}).start()
	} else {
		window.games.getSelectedBranch().gameState = "readyToGame"
		drawMainScreenGameState(window.games.getSelectedGame())
	}
}


function drawQueueValues(place, approx) {
	$('[data-queue]').each(function (i, v) {
		switch ($(this).attr('data-queue')) {
			case 'place':
				if(-1 === parseInt(place)) {
					$(this).html('...')
				} else {
					$(this).html(place + " " + i18next.t("place"))
				}
				break
			case 'approx':
				if(-1 === parseInt(approx)) {
					$(this).html('<span data-i18n="counting_time">'+i18next.t('counting_time')+'</span>')
				} else {
					if(approx<60) {
						$(this).html('<span data-i18n="less_than_minute">'+i18next.t('less_than_minute')+'</span>')
					} else {
						$(this).html(renderSecondsIntoHM(approx))
					}
				}
				break
			default:
				$(this).html('')
				break
		}
	})
}

function setGameUpdateVersion(version) {
	let patch_version = game_install_button.find('.top .version')
	if(patch_version.length) {
		patch_version.text(' '+version)
	} else if ('null'!==version) {
		game_install_button.find('.top').append("<span class='version'> "+version+"</span>")
	}
}





/*FRONTEND FUNCTIONS*/
function changeBackground(page) {

}
function renderBackground(page) {
	try {
		let pageParamsGame = window.pageParams.game[window.games.selectedGameName],
			branchName = window.selectedBranch?.name,
			url = 'img/main_art.jpg',
			bgposition = 'center top',
			pageParams = pageParamsGame?.branch[branchName] || pageParamsGame?.branch.default

		if(pageParams && typeof pageParams[page]['img'] === "string") {
			url = pageParams[page]['img']
		}
		if(pageParams && typeof pageParams[page]['imgPos'] === "string") {
			bgposition = pageParams[page]['imgPos']
		}

		$('#page').css({
			"background": "url("+url+") no-repeat "+bgposition+" "
		})
		//generate blur
		Blur("#head .background")
	} catch (e) {
		console.log(e)
	}
}

function Blur(selector) {
	let $item = $(selector),
		$blur = $(selector).find(".blur"),
		svg_blur = "url(#blur)",
		cssObj = {
			"background": $('#page').css('background'),
			"filter": svg_blur,
			"position": "absolute",
			"top": "0px",
			"left": "-10px",
			"right": "-10px",
			"bottom": "-30px",
			"will-change": "auto",
			"z-index": "-1",
			"transform": "translateZ(0)"
		}
	if(!$blur.length) {
		$item.append('<div class="blur"></div>')
		$blur = $(selector).find(".blur")
	}
	if($item.hasClass('blurer')) {
		cssObj.filter = "url(#important_blur)"
		cssObj['background-position'] = '50% 29%'
		cssObj['top'] = '-20px'
	}
	$blur.css(cssObj)
	$item.css({"overflow":"hidden"})
}

function changePage() {
	let page = $(this).attr('data-view-page')
	if($(this).hasClass('active')){
		return
	}
	setMainMenuButtonActive (page==='main'?'game':page)
	hideAllPages(() => {
		renderPage(page)
	})
}

function renderPage(page) {
	try {
		GoToPage('/page/'+page)

		renderBackground(page)

		switch (page) {
			case "news": showNewsPage(); break
			case "settings": showSettingsPage(); break
			case "ets": showEtsPage(); break
			default: showMainPage(); break
		}

		$(window).trigger('resize')
		current_page = page
	} catch(e) {
		console.log(e)
	}
}

function hideAllPages(callback) {
	if(contentFadingTimer) {
		clearTimeout(contentFadingTimer)
		$('[data-game-select]').removeClass('disabled')
	}

	$('#page>.content').stop(true, false).fadeOut(window.fadeOutSpeed)
	$('#news_item').stop(true, false).fadeOut(window.fadeOutSpeed)
	$('#foot').stop(true, false).fadeOut(window.fadeOutSpeed)
	$('#news_list .carousel').stop(true, false).fadeOut(window.fadeOutSpeed)
	$('#news_list .list').stop(true, false).fadeOut(window.fadeOutSpeed)

	contentFadingTimer = setTimeout(()=>{
		$('[data-toggle-downloads]').removeClass('active')
		$('#ets_content').html('')
		$('#news_item').html('')
		clearNewsPage()
		if (typeof callback === 'function') {
			callback()
		}
	}, window.fadeOutSpeed)

	try {
		if(news_carousel) {
			news_carousel.slick('slickPause')
		}
		if(main_carousel) {
			main_carousel.slick('slickPause')
		}
	} catch (e) {console.log(e)}
	pauseAllVideos()
}

function setMainMenuButtonActive (className) {
	main_menu.find('li').removeClass('active')
	main_menu.find('li.'+className).addClass('active')
}

function showMainPage() {
	$('#foot').stop(true,false).fadeIn(window.fadeInSpeed)
	$('#main_content').stop(true,false).fadeIn(window.fadeInSpeed)

	fetchMainScreenContent(window.settings.selectedGame, window.selectedBranch?.name, window.settings.language)
}


function changeContentLang() {
	try {
		if($('#main_content').length) {
			renderPage(window.current_page.split('_').shift())
		}
	} catch(e) {
		console.log(e)
	}
}


function drawUserData() {
	try {
		let selectedGame = window.games.getSelectedGame(),
			currentGameEtsBranch = window.games.getCurrentGameBranchByName('ets'),
			userData = {
			'login': window.settings.account.nickname ?? '',
			'avatar': window.settings.account.avatar ?? '',
			'gameEdition': selectedGame?.gameEdition ?? '',
			'gameRegion': selectedGame?.purchaseRegion ?? '',
			'etstesterstatus': currentGameEtsBranch?.getParticipantStatusKey() ?? 0,
			'bubble': window.settings.supportNotificationsCount ?? 0
		}
		renderUserData(userData)
	} catch(e) {
		console.log(e)
	}
}

function renderUserData(userData) {
	$.each( userData, function( key, val ) {
		if(key==='avatar') {
			$('#head .user .avatar img').attr('src', val).attr('onerror', 'brokenImage(this)')
		}
		if(key==='login') {
			$('#head .user .username').text(val)
		}
		if(key==='gameEdition' && val !== window.games.getSelectedGame()?.gameEdition) {
			window.games.getSelectedGame().gameEdition = val
		}
		if(key==='gameRegion' && val !== window.games.getSelectedGame()?.purchaseRegion) {
			window.games.getSelectedGame().purchaseRegion = val
		}
		if(key==='bubble') {
			refreshSupportBubble(val)
		}
	})
	whenJqueryFuncAvailable('localize',  function() {
		$('#head .user').localize()
	})
}
/*EOF FRONTEND FUNCTIONS*/

//mainmenu Header collapser
function headerCollapse() {
	let headMenu = $('#head>.wrap>.menu'),
		headerWidth = parseInt(headMenu.width()),
		overflowed

	if(typeof headMenu !== "undefined") {
		if(null === main_menu_collapse_width) {
			reInitCollapse()
		}
		overflowed = headerWidth<main_menu_collapse_width

		if(overflowed) {
			headMenu.addClass('collapsed')
		} else {
			headMenu.removeClass('collapsed')
		}
	}
}

function reInitCollapse() {
	let headMenu = $('#head>.wrap>.menu')
	if(typeof headMenu !== "undefined" && typeof head_user_block.offset() !== "undefined") {
		headMenu.css('opacity', 0)
		headMenu.removeClass('collapsed')
		let headerWidth = parseInt(headMenu.width()),
			menuWidth = parseInt(
				parseInt(head_user_block.offset().left) -
				parseInt($('#sidebar').width()) +
				head_user_block.outerWidth(true) -
				parseInt(head_user_block.css('margin-left'))
			)-2
		if(headerWidth<menuWidth) {
			main_menu_collapse_width = menuWidth
		}
		headMenu.css('opacity', 1)
	}
}

function setCurrentGameServers (servers) {
	if(game_main.length) {
		whenJqueryFuncAvailable('localize',  function() {
			let value,
				selectedServers = servers.filter(function(server){
					return server.isSelected
				})

			if (!selectedServers.length) {
				value = '<span data-i18n="Auto">'+i18next.t("Auto") + "</span>"
				if(window.games.getSelectedGame()?.authRegionByIp) {
					value += " " + window.games.getSelectedGame()?.authRegionByIp
				}
			} else {
				value = selectedServers.map(function(elem){
					return elem.name
				}).join(', ')
			}

			game_main.find('.config-matching .value').html(value)
			game_main.find('.config-matching').attr('data-tooltip', value).attr('data-tooltip-side', 'top-center').attr('data-tooltip-i18n', false)
			initTooltip()
			onResizeGameServers()
		})
	}
}

function onResizeGameServers() {
	if(game_main.length>0) {
		game_main.find('.config-matching .value_wrap').stop( true, true )

		if(game_main.find('.config-matching .value').text().length) {
			game_main.find('.config-matching .value_wrap').removeClass('hidden')
		} else {
			game_main.find('.config-matching .value_wrap').addClass('hidden')
		}

		game_main.find('.config-matching').attr('data-tooltip-hidden', true)
	}
}

function onBranchChange(branch) {
	$('body').attr('data-branch', branch.name)

	let mainButton = $('[data-main-button]')

	$('body [data-branch]').each(function () {
		if($(this).attr('data-branch') === 'default' && $(this).attr('data-game') === window.settings.selectedGame) {
			$(this).removeClass('hidden')
		} else {
			$(this).addClass('hidden')
		}
	})
	if(!branch.isDefault || branch.name === 'tournament') {
		$('body [data-branch]').each(function () {
			if($(this).attr('data-branch') === branch.name && $(this).attr('data-game') === window.settings.selectedGame) {
				$(this).removeClass('hidden')
			} else if($(this).siblings('[data-branch="'+branch.name+'"][data-game="'+window.settings.selectedGame+'"]').length) {
				$(this).addClass('hidden')
			}
		})
	}

	try {
		(window.games.getSelectedGame()?.branches ?? []).forEach(function (branch) {
			mainButton.removeClass(branch.name)
		})
	} catch (e){}
	try {
		$.each(window.pageParams.game, function(key, val){
			mainButton.removeClass(key)
		})
	} catch (e){}
	mainButton.addClass(branch.name).addClass(window.games.selectedGameName)

	renderBackground(window.current_page)
}

function renderBranchList(options) {
	$('#selectedBranch').removeClass('locked')
	let branchesListSelector = '[data-list-menu="selectedBranchName"] ul'
	whenAvailable("i18nLoaded", function() {
		if($(branchesListSelector).length) {
			$(branchesListSelector).html('')

			if(options.length<=1) {
				$('#selectedBranch').addClass('locked')
			}

			$.each(options, function (i, branch) {
				let selected = '',
					disabled = '',
					customLabel = '',
					label = jsUcfirst(branch.name)

				if(!branch.isActive) {
					return
				}

				try {
					customLabel = i18next.t('BranchCustomLabel_'+branch.name)
					if(customLabel.length>0 && 'BranchCustomLabel_'+branch.name !== customLabel) {
						label = customLabel
					}
				} catch (e) {
					console.log({'BranchCustomLabel not found for': branch.name, "searched for": 'BranchCustomLabel_'+branch.name, 'Result':i18next.t('BranchCustomLabel_'+branch.name)})
				}

				if(branch.name === window.selectedBranch.name) {
					selected = 'selected="selected"'
					$('#selectedBranch').html(label).attr('data-value', branch.name)
				}
				if(branch.getParticipantStatusKey() === 3) {
					disabled = 'disabled="disabled"'
				}
				$(branchesListSelector).append('<li data-value="'+branch.name+'" '+selected+' '+disabled+'>'+label+'</li>')
			})
			$('#selectedBranchName li').off('click').on('click', function (e) {
				e.stopImmediatePropagation()
				if(!$('#selectedBranch').hasClass('locked') && !$(this).attr('disabled')) {
					selectBranch($(this).attr('data-value'))
					$('#selectedBranchName').fadeOut(window.fadeOutSpeed).removeClass('visible')
					$('#selectedBranch').removeClass('opened')
				}
			})
		}
	})
}

function refreshBranchSelectorState() {
	//Список кейсов для разблокировки селектора
	let selectedBranchNameMenu = $('[data-list-menu="selectedBranchName"]'),
		branch = window.games.getSelectedBranch()
	if(selectedBranchNameMenu.length) {
		let enabled =
			(window.selectBranchGameUpdateStates.indexOf(branch?.gameUpdateState) !== -1) &&
			(window.selectBranchGameStates.indexOf(branch?.gameState) !== -1)
		selectedBranchNameMenu.prop('disabled', !enabled)
	}
}

function initGameSelect() {
	$('[data-game-select]').off('click').on('click', function () {
		let selectedGame = $(this).attr('data-game-select')
		$('[data-hidden-by-default]').addClass('hidden')
		$('[data-game-select]').removeClass('selected')
		$('[data-game-select="'+selectedGame+'"]').addClass('selected')
		incrementBusyCounter()
		setTimeout(()=>{
			decrementBusyCounter()
		}, window.fadeOutSpeed)

		setMainMenuButtonActive ('game')
		hideAllPages(() => {
			window.current_page = 'main'
			selectGame(selectedGame, () => {
				$('[data-game-select]').removeClass('selected')
				$('[data-game-select="'+selectedGame+'"]').addClass('selected')
			})
		})
		reachClickGoal('click_tab_'+selectedGame)
	})
}

function initDownloadsPage() {
	$('[data-toggle-downloads]').off('click').on('click', function (){
		let contentBlock = $('#downloads_content')
		if(contentBlock.is(":hidden")) {
			Blur('#downloads_content .background')
			contentBlock.stop(true, false).fadeIn(window.fadeInSpeed)
			$(this).addClass('active')
		} else {
			contentBlock.stop(true, false).fadeOut(window.fadeOutSpeed)
			$(this).removeClass('active')
		}
	})
}

function renderSidebarGameLabels() {
	const $sidebarEftIcon = $('.icon.game.eft'),
		$sidebarArenaIcon = $('.icon.game.arena'),
		arenaDiscountLabel = window?.siteConfig?.getDiscountLabel('arena'),
		eftDiscountLabel = window?.siteConfig?.getDiscountLabel('eft')

	$sidebarEftIcon.html('')

	if (eftDiscountLabel) {
		appendDiscountLabel($sidebarEftIcon, eftDiscountLabel)
	}

	$sidebarArenaIcon.html('')
	if (arenaDiscountLabel) {
		appendDiscountLabel($sidebarArenaIcon, arenaDiscountLabel)
	} else if (window?.siteConfig?.isArenaFreeWeekendEnabled) {
		$sidebarArenaIcon.addClass('free_weekend')
	}
}

function appendDiscountLabel($container, labelText) {
	$container
		.append('<div class="discount_label"><div class="text">'+labelText+'</div></div>')
}
