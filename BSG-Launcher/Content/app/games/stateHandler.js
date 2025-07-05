function redrawGames(gamesState, force) {
	window.games.setList(gamesState, force)

	if(window.environment !== 'Production') {
		console.log({
			GamesResponse: gamesState,
			GamesClass: window.games?.list,
			force: force
		})
	}
}

function OnGameUpdated(oldGame, newGame) {
	let oldBranch = oldGame.getSelectedBranch() || new Branch({}),
		newBranch = newGame.getSelectedBranch() || new Branch({}),
		isGameStateChanged = oldBranch.gameState !== newBranch.gameState,
		isGameUpdateStateChanged = oldBranch?.gameUpdateState !== newBranch.gameUpdateState,
		isUpdating = oldBranch?.gameUpdateState !== 'idle'

	renderGameInstallationControlsByState(newGame)

	if(isGameStateChanged || isGameUpdateStateChanged || isUpdating) {
		renderSidebarGameState(newGame)
		renderDownloadsScreenGameRow(newGame)
	}

	renderGameProgress(newGame)
}

function OnSelectedGameUpdated(oldGame, newGame, forceRedrawMainScreen) {
	$('body').attr('data-game', window.games.selectedGameName)
	switchMainScreenSelectedGameName(newGame.name)
	renderMainScreenGameState(oldGame, newGame, forceRedrawMainScreen)
}

function OnSelectedBranchChange(branches) {
	try {
		hideAllPages(() => {
			initBranches(branches)
			if(typeof setLinksUrls === 'function') {
				setLinksUrls(window.settings.authCenterUri, window.authCenterLinks)
				setLinksUrls(getCurrentSiteUrl(), window.main_menu_links)
			}
		})
	} catch (e) {
		console.log(e)
	}
}

async function renderDownloadsScreenGameRow(game) {
	let template = await renderGameRow(game),
		container = $('[data-download-games-list]'),
		availableUpdateStates = [
			"downloadingUpdate",
			"pause",
			"inQueue",
			"checkingUpdateHash",
			"installingUpdate",
			"consistencyChecking",
			"repairingGame"
		],
		branch = game.getSelectedBranch(),
		isGameRowVisible = availableUpdateStates.includes(branch.gameUpdateState) || branch.gameState === 'updateRequired',
		isRowRendered = !!container.find('[data-download-game="' + game.name + '"]').length

	if (isGameRowVisible && !isRowRendered) {
		container.append(template)

		renderGameInstallationControlsByState(game)

		whenJqueryFuncAvailable('localize', () => {
			container.localize()
			initTooltip()
		})
	}

	if(!isGameRowVisible && isRowRendered) {
		container.find('[data-download-game="' + game.name + '"]').remove()
	}

	showDownloadsEmptyString()
}

function showDownloadsEmptyString() {
	let container = $('[data-download-games-list]'),
		emptyLabel = $('[data-download-games-empty]')

	if ($.trim( container.html() ).length) {
		emptyLabel.addClass('hidden')
		container.removeClass('hidden')
	} else {
		container.addClass('hidden')
		emptyLabel.removeClass('hidden')
	}
}

async function renderGameRow(game) {
	let gameRowTemplate = await getTemplate('games/game_download_row.html')
	return Mustache.render(gameRowTemplate, {
		name: game?.name,
		fullName: game?.fullName,
		serverName: game?.selectedBranchName
	})
}

function renderGameProgress(game) {
	let branch = game.getSelectedBranch()
	drawProgressState(
		branch?.gameUpdateState ?? '-',
		game?.name ?? '-',
		branch.isDefault ? null : branch.name,
		branch?.progress?.secondsLeft ?? -1,
		branch?.progress?.current ?? 0,
		branch?.progress?.total ?? 0,
		branch?.progress?.currentSpeed ?? 0
	)
}

function drawProgressState(gameUpdateState, name, serverName, timeLeft, currentSize, totalSize, currentSpeed) {
	let gameSizeLeftText = renderBytes(currentSize, 'size'),
		zeroesString = '0'.repeat($(gameSizeLeftText).text().length),
		zeroesWidth = $('<span>' + zeroesString + '</span>').textWidth(),
		percent = currentSize * 100 / totalSize || 0,
		totalSizeRendered = renderBytes(totalSize, 'size')

	$('[data-game-progress-bar="'+name+'"]').each(function( index ) {
		drawProgressBarValue(percent, $(this))
	})
	$('[data-game-progress-percent="' + name + '"]').html(Math.floor(percent) + '%')
	$('[data-game-progress-total="' + name + '"]').html(totalSizeRendered)
	$('[data-game-progress-downloaded="' + name + '"]').html(gameSizeLeftText).css('width', zeroesWidth)
	$('[data-game-progress-time-left="' + name + '"]').html(formatTime(timeLeft, gameUpdateState))
	$('[data-game-progress-speed="' + name + '"]').html(speedBytesToString(currentSpeed, gameUpdateState))
	if(serverName) {
		$('[data-game-server="' + name + '"]').html(
			'<span data-i18n="Server">' + i18next.t('Server') + '</span> <span>' + serverName + '</span>'
		)
	} else {
		$('[data-game-server="' + name + '"]').html('')
	}
}

function switchMainScreenSelectedGameName(name) {
	$('#gamebar [data-game-server]').attr('data-game-server', name)
	$('#gamebar [data-game-progress-time-left]').attr('data-game-progress-time-left', name)
	$('#gamebar [data-game-progress-percent]').attr('data-game-progress-percent', name)
	$('#gamebar [data-game-progress-downloaded]').attr('data-game-progress-downloaded', name)
	$('#gamebar [data-game-progress-total]').attr('data-game-progress-total', name)
	$('#gamebar [data-game-progress-speed]').attr('data-game-progress-speed', name)
	$('#gamebar [data-game-progress-bar]').attr('data-game-progress-bar', name)
	$('#gamebar [data-game-controls-download]').attr('data-game-controls-download', name)
	$('#gamebar [data-game-controls-suspend]').attr('data-game-controls-suspend', name)
	$('#gamebar [data-game-controls-pause]').attr('data-game-controls-pause', name)
}

function renderMainScreenGameState(oldGame, newGame, forceRedrawMainScreen) {
	let oldBranch = oldGame.getSelectedBranch() || new Branch({}),
		newBranch = newGame.getSelectedBranch() || new Branch({}),
		isGameStateChanged = oldBranch.gameState !== newBranch.gameState || forceRedrawMainScreen,
		isGameUpdateStateChanged = oldBranch.gameUpdateState !== newBranch.gameUpdateState || forceRedrawMainScreen,
		isUpdating = newBranch.gameUpdateState !== 'idle',
		isSwitchedBetweenUpdateOrMainState = isGameUpdateStateChanged && newBranch.gameUpdateState === 'idle'

	if (isUpdating && isGameUpdateStateChanged) {
		warnGameStates('drawMainScreenGameUpdateState ' + newBranch.gameUpdateState)
		drawMainScreenGameUpdateState(newGame)
		return
	}
	if(isGameStateChanged || isSwitchedBetweenUpdateOrMainState) {
		warnGameStates('drawMainScreenGameState ' + newBranch.gameState)
		drawMainScreenGameState(newGame)
	}
}

/** Sidebar state rendering */

function renderSidebarGameState(game) {
	let branch = game.getSelectedBranch(),
		item = $('#sidebar .sb_games_list [data-game-select="' + game.name + '"]')
	if (branch.gameState === 'updateRequired' && branch.gameUpdateState === 'idle') {
		item.find('.icon').attr('data-state-icon', '')
		item
			.find('.subtitle')
			.html('<img class="inline" src="img/icon_inline_download_required.png" alt="update required" /> ' +
				'<span data-i18n="GameUpdateRequiredShort">'+i18next.t('GameUpdateRequiredShort')+'</span>')

	} else if(branch.gameUpdateState === 'inQueue') {
		item.find('.icon').attr('data-state-icon', 'inQueue')
		item
			.find('.subtitle')
			.html('<span data-i18n="DownloadInQueue">'+i18next.t('DownloadInQueue')+'</span>')

	} else if(branch.gameUpdateState === 'pause') {
		item.find('.icon').attr('data-state-icon', 'inQueue')
		item
			.find('.subtitle')
			.html('<span data-i18n="OnPause">'+i18next.t('OnPause')+'</span>: <span data-game-progress-percent="'+game.name+'"></span>')

	} else if(branch.gameUpdateState === 'downloadingUpdate') {
		item.find('.icon').attr('data-state-icon', 'fillingRing')
		item
			.find('.subtitle')
			.html('<span data-i18n="Downloading">'+i18next.t('Downloading')+'</span>: <span data-game-progress-percent="'+game.name+'"></span>')

	} else if(branch.gameUpdateState === 'installingUpdate') {
		item.find('.icon').attr('data-state-icon', 'fillingRing')
		item
			.find('.subtitle')
			.html('<span data-i18n="Unpacking">'+i18next.t('Unpacking')+'</span>: <span data-game-progress-percent="'+game.name+'"></span>')

	} else if(branch.gameUpdateState === 'consistencyChecking') {
		item.find('.icon').attr('data-state-icon', 'fillingRing')
		item
			.find('.subtitle')
			.html('<span data-i18n="Checking">'+i18next.t('Checking')+'</span>: <span data-game-progress-percent="'+game.name+'"></span>')

	} else if(branch.gameUpdateState === 'repairingGame') {
		item.find('.icon').attr('data-state-icon', 'fillingRing')
		item
			.find('.subtitle')
			.html('<span data-i18n="Repairing">'+i18next.t('Repairing')+'</span>: <span data-game-progress-percent="'+game.name+'"></span>')

	} else {
		item.find('.icon').attr('data-state-icon', '')
		item.find('.subtitle').html('')
	}
}

/** EoF Sidebar state rendering */


function drawMainScreenGameState(game) {
	let branch = game.getSelectedBranch()

	setGameInfo(
		game.gameEdition,
		branch?.gameVersion,
		game.purchaseRegion,
		game?.gameEditionTitle
	)
	GoToPage('/game/state/' + branch.gameState)
	disablePowerSave()
	hideGameBlocks()
	resetGameBlock()

	game_main.attr('data-game-state', branch.gameState)

	switch (branch.gameState) {
		case "installRequired":
			top_button_select_folder.removeClass('disabled')
			game_install_button.find('.main_text').html('<i class="icon install"></i><span data-i18n="Install">'+i18next.t('Install')+'</span>')
			game_install_button.attr("data-main-button", 'install')
			game_main.removeClass('hidden')
			break
		case "buyRequired":
			game_install_button.find('.main_text').html('<i class="icon buy"></i><span data-i18n="Buy">'+i18next.t('Buy')+'</span>')
			game_main.find('[data-type="region"]').parent().addClass('hidden')
			setGameInfo(
				null,
				'<span data-i18n="Not installed">'+i18next.t('Not installed')+'</span>',
				'<span data-i18n="empty">'+i18next.t('empty')+'</span>',
				null
			)
			game_install_button.attr("data-main-button", 'buy')
			game_install_button.wrapAll("<a class='out' href='" + getCurrentSiteUrl() + "/preorder-page' data-link='preorder' target='_blank'></a>")
			game_main.removeClass('hidden')
			break
		case "updateRequired":
			if (!game_main.find('[data-type="version"] .error').length) {
				let current_version = game_main.find('[data-type="version"]').text()
				game_main.find('[data-type="version"]')
					.html(
						current_version + " <span class='error' data-i18n='Outdated!'>"+i18next.t('Outdated!')+"</span>"
					)
			}
			game_install_button.addClass('patch').find('.main_text').html(
				'<div class="top"><span data-i18n="Patch detected">'+i18next.t('Patch detected')+'</span></div>' +
				'<i class="icon install"></i><span data-i18n="Update">'+i18next.t('Update')+'</span>'
			)
			game_install_button.attr("data-main-button", 'update')
			setGameUpdateVersion(branch?.gameVersionToUpdate || null)
			game_main.removeClass('hidden')
			break
		case "readyToGame":
			top_button_check_updates.removeClass('disabled')
			game_install_button.find('.main_text').html('<i class="icon man"></i><span data-i18n="Play">'+i18next.t('Play')+'</span>')
			game_install_button.attr("data-main-button", 'start')
			if(window.playButtonLockSeconds) {
				drawMainButtonCountdown(window.playButtonLockSeconds, window.playButtonForceLocked)
			}
			game_main.removeClass('hidden')
			break
		case "availableSoon":
			game_main.find('.top_buttons').css({visibility: "hidden"})
			game_main.find('.game_info>.row').addClass('hidden')
			game_main.find('[data-row-game-edition]').removeClass('hidden')
			game_main.find('[data-row-wait-for-start-of-testing]').removeClass('hidden')
			game_install_button.addClass('disabled')
			game_install_button.find('.main_text').html('<i class="icon man"></i><span class="capitalize" data-i18n="soon">'+i18next.t('soon')+'</span>')
			game_install_button.attr("data-main-button", '')
			game_main.removeClass('hidden')
			break
		case "preparingForGame":
			game_install_button
				.addClass('disabled')
				.find('.main_text')
				.html('<i class="icon man"></i><span data-i18n="In game"></span>')
			top_button_check_updates.find('span').attr('data-i18n', "Checking game").html(i18next.t('Checking game'))
			top_button_check_updates.removeClass('hidden')
			top_button_check_updates.addClass('blinking')
			game_install_button.attr("data-main-button", 'start')
			whenJqueryFuncAvailable('localize', function () {
				$('body').localize()
			})
			game_main.removeClass('hidden')
			break
		case "inQueue":
			game_install_button.find('.main_text').html('<i class="icon queue"></i><span data-i18n="Cancel">'+i18next.t('Cancel')+'</span>')
			game_main.find('.top_buttons').css({visibility: "hidden"})
			game_main.find('.game_info').addClass('hidden')
			game_main.find('.game_queue').removeClass('hidden')
			game_install_button.attr("data-main-button", 'inqueue')
			game_main.removeClass('hidden')
			break
		case "inGame":
			top_button_select_folder.removeClass('disabled')
			game_install_button.addClass('disabled')
			game_install_button.find('.main_text').html('<i class="icon man"></i><span data-i18n="In game">'+i18next.t('In game')+'</span>')
			game_main.find('.top_buttons').css({visibility: "hidden"})
			game_install_button.attr("data-main-button", 'ingame')
			game_main.removeClass('hidden')
			enablePowerSave()
			break
		case "reinstallRequired":
			top_button_select_folder.removeClass('disabled')
			game_install_button.find('.main_text').html('<i class="icon cloud"></i><span data-i18n="Reinstall">'+i18next.t('Reinstall')+'</span>')
			game_main.find('.block').addClass('error')
			game_main.find('.reinstall_error').removeClass('hidden')
			game_main.find('.game_info').addClass('hidden')
			game_install_button.attr("data-main-button", 'install')
			game_main.removeClass('hidden')
			break
		case "repairRequired":
			top_button_select_folder.removeClass('disabled')
			game_install_button.find('.main_text').html('<i class="icon cloud"></i><span data-i18n="Repair">'+i18next.t('Repair')+'</span>')
			game_main.find('.block').addClass('error')
			game_main.find('.reinstall_error .mes_3').attr('data-i18n', 'Repair required.')
			game_main.find('.reinstall_error').removeClass('hidden')
			game_main.find('.game_info').addClass('hidden')
			game_install_button.attr("data-main-button", 'repair')
			game_main.removeClass('hidden')
			break
		default:
			break
	}
	whenJqueryFuncAvailable('localize', function () {
		game_main.localize()
	})
}

function drawMainScreenGameUpdateState(game) {
	let branch = game.getSelectedBranch()
	GoToPage('/game/update/' + branch.gameUpdateState)
	hideGameBlocks()
	switchCurrentGameUploadsState(branch.gameUpdateState)
	whenJqueryFuncAvailable('localize', function () {
		game_installer.localize()
	})
}

function resetGameUpdate() {
	game_installer.find('.notes>.left').addClass('hidden')
	game_installer.find('[progress-bar]').attr('progress-bar', 'main')
	game_installer.find('.slider_animation').addClass('hidden')
	game_installer.find('.slider_animation .light').css('left', '0')
	game_installer.find('#game_current_speed').addClass('hidden')
	game_installer.find('#game_current_percent').addClass('hidden')
	game_installer.find('#time_left_block').addClass('hidden')
	game_installer.find('#game_time_left').html('')
	game_installer.removeClass('shrink')
}
function switchCurrentGameUploadsState(state) {
	resetGameUpdate()
	let installStateTextCont = $('#install_state_text')
	game_installer.attr('data-game-update-state', state)
	switch (state) {
		case "idle":
			if (!playButtonForceLocked) {
				game_install_button.removeClass('disabled')
			}
			game_main.removeClass('hidden')
			break
		case "checkingForUpdate":
			top_button_check_updates.find('span').attr('data-i18n', "Searching for updates").html(i18next.t('Searching for updates'))
			top_button_check_updates.addClass('blinking')
			game_install_button
				.addClass('disabled')
			game_main.removeClass('hidden')
			break
		case "downloadingUpdate":
			installStateTextCont.attr("data-i18n", "Downloading files")
			game_installer.find('.notes>.left').removeClass('hidden')
			game_installer.find('#game_current_speed').removeClass('hidden')
			game_installer.find('#game_current_percent').removeClass('hidden')
			game_installer.find('#time_left_block').removeClass('hidden')
			game_installer.removeClass('hidden')
			break
		case "pause":
			installStateTextCont.attr("data-i18n", "OnPause")
			game_installer.find('.notes>.left').removeClass('hidden')
			game_installer.find('#game_current_speed').removeClass('hidden')
			game_installer.find('#game_current_percent').removeClass('hidden')
			game_installer.find('#time_left_block').removeClass('hidden')
			game_installer.removeClass('hidden')
			break
		case "inQueue":
			installStateTextCont.attr("data-i18n", "DownloadInQueue")
			game_installer.find('.notes>.left').removeClass('hidden')
			game_installer.removeClass('hidden')
			break
		case "checkingUpdateHash": //Check update hash(MD5)
			installStateTextCont.attr("data-i18n", "Checking")
			game_installer.find('#game_current_percent').removeClass('hidden')
			game_installer.find('[progress-bar]').attr('progress-bar', 'wide')
			game_installer.removeClass('hidden')
			break
		case "installingUpdate":
			installStateTextCont.attr("data-i18n", "Unpacking game files")
			game_installer.find('#game_current_percent').removeClass('hidden')
			game_installer.find('[progress-bar]').attr('progress-bar', 'wide')
			game_installer.removeClass('hidden')
			break
		case "consistencyChecking":
			installStateTextCont.attr("data-i18n", "Checking the integrity of game files")
			game_installer.find('#game_current_percent').removeClass('hidden')
			game_installer.find('[progress-bar]').attr('progress-bar', 'wide')
			game_installer.removeClass('hidden')
			break
		case "repairingGame":
			installStateTextCont.attr("data-i18n", "Repairing the game")
			game_installer.find('#game_current_percent').removeClass('hidden')
			game_installer.find('[progress-bar]').attr('progress-bar', 'wide')
			game_installer.removeClass('hidden')
			break
		default:
		//Unknown state
	}
}

function renderGameInstallationControlsByState(game) {
	let branch = game.getSelectedBranch()
	hideGameControls(game.name)

	let gameDownloadBlockSelector = '[data-download-game="' + game.name + '"]',
		isUpdating = branch?.gameUpdateState !== 'idle'

	if(!isUpdating) {
		switch (branch.gameState) {
			case "updateRequired":
				$('[data-game-controls-download="' + game.name + '"]').removeClass('hidden')
				$(gameDownloadBlockSelector+' .controls').removeClass('hidden')
				$(gameDownloadBlockSelector+' [data-game-sub-text]')
					.html('<span data-i18n="GameUpdateRequired">'+i18next.t('GameUpdateRequired')+'</span>')
				break
			case "installRequired":
			case "buyRequired":
			case "readyToGame":
			case "preparingForGame":
			case "inQueue":
			case "inGame":
			case "reinstallRequired":
			case "repairRequired":
			default:
				break
		}
	}
	switch (branch.gameUpdateState) {
		case "checkingForUpdate":
			$('[data-download-game="' + game.name + '"] .progress .bottom .right').removeClass('hidden')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			$('[data-game-controls-pause="' + game.name + '"]').removeClass('hidden')
			$('[data-game-controls-suspend="' + game.name + '"]').removeClass('hidden')
			$(gameDownloadBlockSelector+' .controls').removeClass('hidden')
			break
		case "downloadingUpdate":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="Downloading">'+i18next.t('Downloading')+'</span>: <span ' +
					'data-game-progress-percent="'+game.name+'"></span>')
			$('[data-download-game="' + game.name + '"] .progress .bottom .right').removeClass('hidden')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			$('[data-game-controls-pause="' + game.name + '"]').removeClass('hidden')
			$('[data-game-controls-suspend="' + game.name + '"]').removeClass('hidden')
			$(gameDownloadBlockSelector+' .controls').removeClass('hidden')
			break
		case "pause":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="OnPause">'+i18next.t('OnPause')+'</span>: <span ' +
					'data-game-progress-percent="'+game.name+'"></span>')
			$('[data-download-game="' + game.name + '"] .progress .bottom .right').removeClass('hidden')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			$('[data-game-controls-download="' + game.name + '"]').removeClass('hidden')
			$('[data-game-controls-suspend="' + game.name + '"]').removeClass('hidden')
			$(gameDownloadBlockSelector+' .controls').removeClass('hidden')
			break
		case "inQueue":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="DownloadInQueue">'+i18next.t('DownloadInQueue')+'</span>')
			$(gameDownloadBlockSelector+' [data-game-server]')
				.html('<span data-i18n="DownloadInQueue">'+i18next.t('DownloadInQueue')+'</span>')
			$('[data-download-game="' + game.name + '"] .progress .bottom .right').removeClass('hidden')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			$('[data-game-controls-download="' + game.name + '"]').removeClass('hidden')
			$('[data-game-controls-suspend="' + game.name + '"]').removeClass('hidden')
			$(gameDownloadBlockSelector+' .controls').removeClass('hidden')
			break
		case "checkingUpdateHash":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="Checking">'+
					i18next.t('Checking')+'</span>: <span ' +
					'data-game-progress-percent="'+game.name+'"></span>')
			$('[data-download-game="' + game.name + '"] [data-game-progress-bar]').attr('progress-bar', 'ultrawide')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			break
		case "installingUpdate":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="Unpacking game files">'+
					i18next.t('Unpacking game files')+'</span>: <span ' +
					'data-game-progress-percent="'+game.name+'"></span>')
			$('[data-download-game="' + game.name + '"] [data-game-progress-bar]').attr('progress-bar', 'ultrawide')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			break
		case "consistencyChecking":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="Checking the integrity of game files">'+
					i18next.t('Checking the integrity of game files')+'</span>: <span ' +
					'data-game-progress-percent="'+game.name+'"></span>')
			$('[data-download-game="' + game.name + '"] [data-game-progress-bar]').attr('progress-bar', 'ultrawide')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			break
		case "repairingGame":
			$(gameDownloadBlockSelector+' [data-game-sub-text]')
				.html('<span data-i18n="Repairing the game">'+
					i18next.t('Repairing the game')+'</span>: <span ' +
					'data-game-progress-percent="'+game.name+'"></span>')
			$('[data-download-game="' + game.name + '"] [data-game-progress-bar]').attr('progress-bar', 'ultrawide')
			$(gameDownloadBlockSelector+' .progress').removeClass('hidden')
			break
		case "idle":
		default:
			break
	}

	whenJqueryFuncAvailable('localize', function () {
		$('[data-download-game="' + game.name + '"]').localize()
	})
}

function hideGameControls(gameName) {
	$('[data-game-controls-download="' + gameName + '"]').addClass('hidden')
	$('[data-game-controls-pause="' + gameName + '"]').addClass('hidden')
	$('[data-game-controls-suspend="' + gameName + '"]').addClass('hidden')
	$('[data-download-game="' + gameName + '"] .controls').addClass('hidden')
	$('[data-download-game="' + gameName + '"] .progress').addClass('hidden')
	$('[data-download-game="' + gameName + '"] .progress .bottom .right').addClass('hidden')
	$('[data-download-game="' + gameName + '"] [data-game-progress-bar]').attr('progress-bar', 'medium')
}

function refreshFooterSettingsShortcuts() {
	let speedLimitLabel = window.settings.maxDownloadSpeed > 0 ?
			renderBytes(window.settings.maxDownloadSpeed*1024, 'speed')
			: '<span data-i18n="unlimited">'+i18next.t('unlimited')+'</span>'

	$('[data-download-speed-limit]').html(
		'<div><span data-i18n="Maximum download speed">' +
		i18next.t("Maximum download speed") + '</span> (' + speedLimitLabel + ')</div>'
	)
}

function warnGameStates(message) {
	if(window.environment !== 'Production') {
		console.warn(message)
	}
}
