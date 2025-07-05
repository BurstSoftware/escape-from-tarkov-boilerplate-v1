//Bind launcher async object into DOM
(async function()
{
	await CefSharp.BindObjectAsync("launcher")
})();
(async function()
{
	$(document).ready( function () {
		setTimeout(function () {
			launcherDisplayBrowser()
		}, 2000)
	})
})()
try {
	$.ajaxSetup({async:true, cache:true})
} catch (e) {
	console.log(e)
}

$(document).ready( function () {
	whenAvailable('launcher', function () {
		initLocalization(window.settings.language)
		if(typeof refreshNetworkState === "function") {
			refreshNetworkState()
		}
		if(typeof initGameSelect === "function") {
			initGameSelect()
		}
		if(typeof initDownloadsPage === "function") {
			initDownloadsPage()
		}
		if($('#queueNotifyWithSound').length) {
			if (window.settings.queueNotifyWithSound) {
				$('#queueNotifyWithSound').attr('checked', 'checked')
			} else {
				$('#queueNotifyWithSound').removeAttr('checked')
			}
		}
		if($('#queueAutoLogIn').length) {
			if (window.settings.queueAutoLogIn) {
				$('#queueAutoLogIn').attr('checked', 'checked')
			} else {
				$('#queueAutoLogIn').removeAttr('checked')
			}
		}
		if($('#LauncherLogin').length) {
			initLoginPage(window.settings.saveLogin, false, window.settings.login)
		}
		if(typeof initRegistrationPage === "function") {
			initRegistrationPage()
		}
		if($('#license_agreement_page').length) {
			if(typeof getLegalRequiredDoc === 'function') {
				getLegalRequiredDoc(window.settings.language)
			}
			if($('#language').length) {
				$('#language').val(window.settings.language)
			}
		}
		initListMenus()
		if(typeof initSound === "function") {
			initSound()
		}
		whenAvailable('ym',  function() {
			ym(window.yandexMetrikaId, 'setUserID', window.settings.account.id.toString())
		})

		initResizeListeners()
		initWindowManipulations()
		initAcLinks()
		initAnalytics()
	})
	$(document).on('click', '[data-reach-goal]', function(e) {
		let action = $(this).attr('data-action') || 'click',
			label = $(this).attr('data-label') || false,
			page = $(this).attr('data-page') || 'index'
		ReachGoal(action, label, page)
	})
	$(document).on('click', '[data-open-directory]', function(e) {
		navigateToDirectory($(this).text())
	})
})

function initWindowManipulations() {
	w_close.click(function(e){
		launcherClose();
	});
	
	w_maximize.click(function(e){
		if(w_maximize.hasClass('maximized')) {
			launcherRestore();
		} else {
			launcherMaximize();
		}
	});
	
	w_minimize.click(function(e){
		launcherMinimize();
	});

}

function setUserETSStatus(val) {
	if(window.ets_tester_status !== val && window.ets_tester_status !== null) {
		if(typeof reloadSettings === 'function') {
			reloadSettings();
		}
		if(typeof showUserEtsStatus === 'function') {
			showUserEtsStatus(val);
		}
		removeContentCache(window.games.selectedGameName + '_' + window.selectedBranch?.name+'_etsPage_'+window.settings.language)
	}
	window.ets_tester_status = val;
	if(typeof refreshBranchSelectorState === 'function') {
		refreshBranchSelectorState();
	}
}


function setLauncherVersion(version) {
	window.launcher_version = version;
	if($('#LauncherVersion').length){
		$('#LauncherVersion').text(version);
	}
}
function setGameInfo(edition, version, region, editionTitle) {
	setGameEdition(editionTitle ? editionTitle : window.editions[edition])
	setGameVersion(version)
	setGameRegion(region)
}
function setGameEdition(edition) {
	let isAvailableBugreport = true,
		gameSelectButton = $('[data-game-select="'+window.games.selectedGameName+'"]')
	gameSelectButton.removeClass('not_purchased')

	if(!edition || typeof edition === 'undefined' || edition.length === 0) {
		isAvailableBugreport = false
		edition = window.editions["not_purchased"]
		gameSelectButton.addClass('not_purchased')
	}


	if(game_main.length) {
		game_main.find('[data-type="edition"]').html(edition)
		try {
			whenJqueryFuncAvailable('localize',  function() {
				game_main.localize()
			});
		} catch(e) {
			console.log(e)
		}
	}

	refreshBugReportButton(isAvailableBugreport)
}
function setGameVersion(version) {
	window.game_version = version
	if(!version || version === "" || version === "null") {
		version = '<span data-i18n="Not installed"></span>'
	}
	$('[data-type="version"]').html(version)
}
function setGameRegion(region) {
	window.game_region = region
	if(game_main.length) {
		if(!region || region === "") {
			region = '<span data-i18n="empty">'+i18next.t('empty')+'</span>'
		}
		game_main.find('[data-type="region"]').html(region)
	}
}

function renderSeconds(seconds) {
	let result = '',
		d,
		h = moment.duration(seconds * 1000).hours(),
		m = moment.duration(seconds * 1000).minutes(),
		s = moment.duration(seconds * 1000).seconds();
	
	d = Math.floor( seconds * 1000 / 86400000 );
	h = $.trim(h).length === 1 ? '0' + h : h;
	m = $.trim(m).length === 1 ? '0' + m : m;
	s = $.trim(s).length === 1 ? '0' + s : s;
	// show how many hours, minutes and seconds are left
	if(d>0) {
		result += "<span class='days'>"+d+i18next.t("DayLabel")+"</span> ";
	}
	result += "<span class='hour'>"+h+"</span>:";
	result += "<span class='min'>"+m+"</span>:";
	result += "<span class='sec'>"+s+"</span>";
	
	return result;
}

function renderSecondsIntoHM(seconds) {
	let result = '',
		h,
		m = moment.duration(seconds * 1000).minutes()
	h = Math.floor( seconds * 1000 / 3600000 )
	m = $.trim(m).length === 1 ? '0' + m : m
	result += "<span class='hour'>"+h+i18next.t("h.")+"</span> "
	result += "<span class='min'>"+m+i18next.t("m.")+"</span> "
	return result
}

function Countdown(options) {
	let instance = this,
		seconds = options.seconds || 10,
		updateStatus = options.onUpdateStatus || function () {},
		counterEnd = options.onCounterEnd || function () {}

	if(!options.uniqueKey) {
		options.uniqueKey = 'randomCountdownKey'+Math.random()
	}

	function decrementCounter() {
		updateStatus(seconds)
		if (seconds === 0) {
			counterEnd()
			instance.stop()
		}
		seconds--
	}
	
	this.start = function () {
		instance.stop()
		seconds = options.seconds
		window.jsIntervals[options.uniqueKey] = setInterval(decrementCounter, 1000)
	}
	
	this.stop = function () {
		clearInterval(window.jsIntervals[options.uniqueKey])
		delete window.jsIntervals[options.uniqueKey]
	}
}

function jsUcfirst(string)
{
	return string.charAt(0).toUpperCase() + string.slice(1)
}

function setCapsLockState (bool) {
	//for use in login form later
}

//Callback при масштабировании окна кнопками
function onChangeWindowState(state) {
	if('Normal'==state) {
		w_maximize.removeClass('maximized')
	}
	if('Maximized'==state) {
		w_maximize.addClass('maximized')
	}
	if('Minimized'==state) {
	
	}
}

function setLauncherUpdateState(state) {

}

function setLauncherUpdateProgress(progress) {
	drawProgressBarValue(progress, $('[progress-bar]'))
}

function drawProgressBarValue(value, element) //float value in (0%, 100%)
{
	try {
		let widgetSlider = element.find('.slider'),
			widgetSliderAnimation = element.find('.slider_animation'),
			total_width = parseInt(element.width())-3,
			width = parseInt(total_width*value/100),
			effects = widgetSlider.find('.effect')

		if(value === 0) {
			widgetSliderAnimation.addClass('hidden')
		} else {
			widgetSliderAnimation.removeClass('hidden')
			widgetSliderAnimation
				.find('.light')
				.css('width', (91 + 43 + parseInt(total_width)) + "px")
		}

		if(value>30 && value<50) {
			let diapason = 50-30,
				dif = 50 - value,
				opacity
			opacity = 1-dif/diapason
			effects.css({'opacity': opacity})
		} else if (value>=50) {
			effects.css({'opacity': 1})
		} else if(value<=30) {
			effects.css({'opacity': 0})
		}

		widgetSlider.css({"width":width+'px'})
	} catch (e) {
		console.log(e)
	}
}

function refreshSelectFolder() {
	let branch = window.games.getSelectedBranch(),
		items = [
		'[onclick*="selectGameFolder"]',
		'[onclick*="clearTempFolder"]',
		'[onclick*="selectTempFolder"]'
	]

	if(
		(window.selectFolderGameUpdateStates.indexOf(branch?.gameUpdateState) !== -1) &&
		(window.selectFolderGameStates.indexOf(branch?.gameState) !== -1)
	) {
		$.each(items, function (i, v) {
			$(v).removeClass('disabled')
		})
	} else {
		$.each(items, function (i, v) {
			$(v).addClass('disabled')
		})
	}
}
function refreshFeedbackButton() {
	let branch = window.games.getSelectedBranch(),
		items = [
		'[onclick*="showFeedback"]'
	]
	if(
		(window.sendFeedbackGameUpdateStates.indexOf(branch?.gameUpdateState) !== -1) &&
		(window.sendFeedbackGameStates.indexOf(branch?.gameState) !== -1) &&
		branch?.isFeedbackEnabled()
	) {
		$.each(items, function (i, v) {
			$(v).removeClass('disabled')
		})
	} else {
		$.each(items, function (i, v) {
			$(v).addClass('disabled')
		})
	}
}
function refreshCheckForUpdate() {
	let branch = window.games.getSelectedBranch(),
		items = [
		'[onclick*="navigateToCurrentGameDirectory"]',
		'[onclick*="checkForUpdate"]',
		'[onclick*="checkConsistency"]',
		'[onclick*="clearCache"]',
		'[onclick*="showDir"]'
	]

	if(
		(window.checkForUpdateGameUpdateStates.indexOf(branch?.gameUpdateState) !== -1) &&
		(window.checkForUpdateGameStates.indexOf(branch?.gameState) !== -1)
	) {
		$.each(items, function (i, v) {
			$(v).removeClass('disabled')
		})
	} else {
		$.each(items, function (i, v) {
			$(v).addClass('disabled')
		})
	}
}
function refreshBugReportButton(isAvailableBugreport) {
	let items = [
		'[onclick*="showBugreport"]'
	]
	if(!isAvailableBugreport) {
		$.each(items, function (i, v) {
			$(v).addClass('disabled').addClass('hidden')
		})
	} else {
		$.each(items, function (i, v) {
			$(v).removeClass('disabled').removeClass('hidden')
		})
	}
}

function refreshMatchingConfig() {
	let items = [
		'[onclick*="showMatchingConfig"]'
	]
	$.each(items, function (i, v) {
		if(window?.siteConfig?.isMatchingConfigEnabled) {
			$(v).removeClass('hidden')
		} else {
			$(v).addClass('hidden')
		}
	})
}

function resizeWindow(width, height) {
	if(!$.isNumeric( width )) {
		width = $('body>div').width();
	}
	if(!$.isNumeric( height )) {
		height = $('body>div').height();
	}
	
	$('body').css({width: width, height: height});
	launcherSetWindowSize(width+2, height+2);
}

function renderBytes(bytes, type, needed) {
	try {
		let value = 0,
			label = '',
			localeKey = ''
		if(needed === 'KB') {
			value = (bytes / 1024).toFixed(0)
			return '<span class="value">'+formatSpaces(value) + '</span>'
		} else if (needed === 'MB') {
			value = (bytes / 1048576).toFixed(0)
			return '<span class="value">'+formatSpaces(value) + '</span>'
		}

		if (bytes < 1048576) { //KB
			if (type === 'speed') {
				localeKey = "KB/sec"
				label = i18next.t("KB/sec")
			} else if (type === 'size') {
				localeKey = "KB"
				label = i18next.t("KB")
			}
			value = (bytes / 1024).toFixed(0)
		} else { //MB
			if (type === 'speed') {
				localeKey = "MB/sec"
				label = i18next.t("MB/sec")
			} else if (type === 'size') {
				localeKey = "MB"
				label = i18next.t("MB")
			}
			value = (bytes / 1048576).toFixed(0)
		}

		return '<span class="value">'+formatSpaces(value) + '</span> <span data-i18n="'+localeKey+'">'+label+'</span>'
	} catch(e) {
		console.log(e)
	}
}

function speedBytesToString(speed, gameUpdateState) {
	let pausedKey = "Paused",
		pausedText = i18next.t(pausedKey),
		waitingKey = "Waiting",
		waitingText = i18next.t(waitingKey)

	if (gameUpdateState === "pause") {
		return '<span data-i18n="' + pausedKey + '">' + pausedText + '</span>'
	}

	if (speed > 0) {
		return renderBytes(speed, 'speed')
	}

	return '<span data-i18n="' + waitingKey + '">' + waitingText + '</span>'
}

function formatTime(time, gameUpdateState) {
	if (gameUpdateState === "pause") {
		return '<span data-i18n="DownloadingPaused">'+i18next.t('DownloadingPaused')+'</span>'
	}
	if(time<0) {
		return '<span data-i18n="Calculating time">'+i18next.t('Calculating time')+'</span>'
	}
	if(time>3600) {
		return '<span data-i18n="more_than_one_hour_left">'+i18next.t('more_than_one_hour_left')+'</span>'
	}
	
	let result = '<span data-i18n="left" class="capitalize">'+i18next.t('left')+'</span>:',
		sec = time,
		hours = sec/3600 ^ 0,
		minutes = (sec-hours*3600)/60 ^ 0,
		seconds = sec-hours*3600-minutes*60,
		hours_label = '<span data-i18n="pl_hours" data-i18n-options='+JSON.stringify({count: hours})+'>'+i18next.t('pl_hours', {count: hours})+'</span>',
		minutes_label = '<span data-i18n="pl_minutes" data-i18n-options='+JSON.stringify({count: minutes})+'>'+i18next.t('pl_minutes', {count: minutes})+'</span>',
		seconds_label = '<span data-i18n="pl_seconds" data-i18n-options='+JSON.stringify({count: seconds})+'>'+i18next.t('pl_seconds', {count: seconds})+'</span>'
	
	if(hours>0) {
		result += " " + hours + " " + hours_label + ", " + minutes + " " + minutes_label
	} else if(minutes>0) {
		result += " " + minutes + " " + minutes_label
	} else {
		result += " " + seconds + " " + seconds_label
	}
	
	return result
}

function initResizeListeners() {
	try {
		$(window).on('resize', function() {
			if(typeof calculateImportantResponsive === 'function') {
				calculateImportantResponsive();
			}
			/*
			if(typeof headerCollapse === 'function') {
				headerCollapse();
			}
			*/
			if(typeof onResizeGameServers === 'function') {
				onResizeGameServers();
			}
			
			if($("#important_news .item .blur").length){
				$("#important_news .item .blur").toggleClass("refresh");
			}
			
			
			if($("#main_content").length){
				if($( window ).height() > 750) {
					$('#main_content').removeClass('collapsed');
				} else {
					$('#main_content').addClass('collapsed');
				}
			}
		});
	} catch(e) {
		console.log(e);
	}
}


/**LOCALIZATION FUNCTIONS*/
function getTranslation(lang_name) {
	return $.ajax({
		'async': false,
		'global': false,
		'url': 'locales/'+lang_name+'/translation.json',
		'dataType': "json"
	});
}

function initLocalization(lang) {
	try {
		$.holdReady(true);
		var resources = {},
			promises = [];

		$.each(window.langs, function(code, title) {
			promises.push(getTranslation(code).done(function (data) {
				if(typeof data !== 'undefined') {
					resources[code] = {};
					resources[code].translation = data;
				} else {
					console.log('Undefined locale found ' + code);
				}
			}));
		});

		$.when.apply($, promises).catch(function (err) {
			console.log('ERROR loading locales');
			setTimeout(function () {
				launcherDisplayBrowser();
			}, 3);
		}).then(function() {
			i18next.init({
				"debug": window.environment !== 'Production',
				"lng": lang,
				"fallbackLng" : "en",
				"keySeparator": false,
				"nsSeparator": false,
				"resources": resources
			}, function(err, t) {
				$.holdReady(false);
				jqueryI18next.init(i18next, $, {
					tName: 't', // --> appends $.t = i18next.t
					i18nName: 'i18n', // --> appends $.i18n = i18next
					handleName: 'localize', // --> appends $(selector).localize(opts);
					selectorAttr: 'data-i18n', // selector for translating elements
					targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if diffrent then itself)
					optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
					useOptionsAttr: true, // see optionsAttr
					parseDefaultValueFromContent: false // parses default values from content ele.val or ele.text
				});
				window.i18nLoaded = true
				i18next.on('languageChanged', (lng) => {
					window.settings.language = lng
					moment.locale(i18nLangCode(lng))
					window.s2opt = {
						minimumResultsForSearch: Infinity,
						language: i18nLangCode(lng)
					};
					if(typeof changeContentLang === 'function') {
						changeContentLang(window.settings.language);
					}
					if(typeof calculateImportantResponsive === 'function') {
						calculateImportantResponsive();
					}
					if(window.current_page !== 'ets') {
						$('#ets_content').html('');
					}
					initTooltip();
					whenJqueryFuncAvailable('localize',  function() {
						$("body").localize()
						if(!$('#feedback_page').length) {
							$("select").select2(window.s2opt)
						}
						main_menu_collapse_width = null
						$(window).trigger('resize')
						if(typeof renderSiteConfig === 'function') {
							renderSiteConfig()
						}
					});
					$('html').attr('lang', lng);
				});
				$('html').attr('lang', lang)
				moment.locale(i18nLangCode(lang))
				initTooltip()
				whenJqueryFuncAvailable('localize',  function() {
					$("body").localize()
					if(!$('#feedback_page').length) {
						$("select").select2(window.s2opt)
					}
					setTimeout(function () {
						launcherDisplayBrowser()
					}, 3)
				})
			});
		});

	} catch(e) {
		console.log(e);
	}
}

function i18nLangCode(lang) {
	let i18nCode = lang;
	switch (lang) {
		case 'mx': i18nCode = 'es-MX'; break;
		case 'zh': i18nCode = 'zh-CN'; break;
	}
	return i18nCode;
}

function redrawLanguage(lng) {
	try {
		if(window.langIsRendering) {
			return
		}
		window.langIsRendering = true
		whenAvailable("i18nLoaded", function() {
			i18next.changeLanguage(lng)
			if(!$('#feedback_page').length) {
				$("select").select2(window.s2opt)
			}
			window.langIsRendering = false
		});
	} catch (e) {
		console.log(e);
	}
}

function getContentCache(key) {
	if(typeof window.contentCache[key] !== 'undefined') {
		if(window.contentCache[key]['valid'] >= Date.now()) {
			return window.contentCache[key]['data']
		}
	}
	return null
}

function setContentCache(key, val, valid) {
	return window.contentCache[key] = {'data': val, 'valid': valid};
}

function removeContentCache(key) {
	return delete window.contentCache[key]
}

function onSettingsUpdated(newSettings) {
	let langIsChanged = window.settings.language && window.settings.language !== newSettings.language

	window.settings = new Settings(newSettings)

	if($('#head .wrap .user').length) {
		drawUserData()
	}

	if(window.environment !== 'Production') {
		console.log({
			'SettingsResponse' : newSettings,
			'SettingsClass' : window.settings
		})
	}

	if(typeof setGamesToMatchingWindow === 'function') {
		setGamesToMatchingWindow(newSettings.games)
	}

	if(window.settings?.selectedGame) {
		$('body').attr('data-game', window.settings?.selectedGame)
		setCurrentGameLoader(window.settings?.selectedGame)
	}

	if(typeof newSettings.configuration !== 'undefined') {
		window.environment = newSettings.configuration
	}

	if(typeof newSettings.tempFolder !== 'undefined') {
		renderDirectoryPath(newSettings.tempFolder, '#tempDir')
	}
	if(typeof newSettings.gamesRootDir !== 'undefined') {
		renderDirectoryPath(newSettings.gamesRootDir, '#gamesRootDir')
	}

	if(typeof refreshFooterSettingsShortcuts === 'function') {
		refreshFooterSettingsShortcuts()
	}

	if(langIsChanged) {
		redrawLanguage(newSettings.language)
	}
}

function initBranches(branches) {
	if(typeof onBranchChange === 'function') {
		onBranchChange(window.selectedBranch)
	}
	if(typeof renderBranchList === 'function') {
		renderBranchList(branches)
	}
}

function getCurrentSiteUrl() {
	return cutLastSlash(window.selectedBranch.siteUri)
}

function initAcLinks() {
	let baseUrl = window.settings.authCenterUri
	if(typeof baseUrl === 'string') {
		setLinksUrls(baseUrl, window.authCenterLinks)
		displayLinksUrls(baseUrl, window.authCenterLinks)
	}
}

function initSiteLinks() {
	let siteUrl = getCurrentSiteUrl()
	if(typeof siteUrl === 'string') {
		setLinksUrls(siteUrl, window.main_menu_links)
		displayLinksUrls(siteUrl, window.main_menu_links)
	}
}

function setLinksUrls(baseUrl, links) {
	if(typeof baseUrl === 'string') {
		for (let sKey in links) {
			let SiteLinkRoute = links[sKey],
				$element = $('[data-link='+sKey+']')
			if(sKey === 'expansions' && window.settings.selectedGame !== 'eft') {
				break
			}
			if(null !== SiteLinkRoute && isOutLink($element)) {
				setLinkUrl($element, baseUrl + SiteLinkRoute)
			}
		}
	}
}
function displayLinksUrls(baseUrl, links) {
	if(typeof baseUrl === 'string') {
		for (let sKey in links) {
			let SiteLinkRoute = links[sKey],
				$element = $('[data-link='+sKey+']')
			if(
				null === SiteLinkRoute ||
				(
					$element.attr('data-game') &&
					$element.attr('data-game') !== window?.settings?.selectedGame
				)
			) {
				hideLink($element)
			} else {
				showLink($element)
			}
		}
	}
}

function hideLink($element) {
	if(isOutLink($element)) {
		$element
			.parent()
			.addClass('hidden')
	} else {
		$element
			.addClass('hidden')
	}
}

function showLink($element) {
	if(isOutLink($element)) {
		$element.parent().removeClass('hidden')
	} else {
		$element.removeClass('hidden')
	}
}

function setLinkUrl($element, linkUrl) {
	$element.attr('href', linkUrl)
}

function isOutLink($element) {
	return ($element.hasClass('out')
		|| $element.parent().hasClass('out')
		|| $element.find('.out').length) && typeof $element.attr('href') !== "undefined"
}


function renderDirectoryPath(path, selector) {
	if(typeof path === "string") {
		if($(selector).length){
			try {
				$(selector).text(path.replace(window.game_dir_pregmatch,"")).removeClass('hidden');
			} catch (e) {
				console.log(e);
			}
		}
	} else {
		$(selector).addClass('hidden');
	}
}
/**EOF LOCALIZATION FUNCTIONS*/


function isLoginPage() {
	return !!$('#LauncherLogin').length;
}

function showLoader() {
	if(window.games.selectedGameName) {
		setCurrentGameLoader(window.games.selectedGameName)
	}
	$('#loading').stop( true, false ).fadeIn(window.fadeInSpeed)
}

function hideLoader() {
	if(window.games.selectedGameName) {
		setCurrentGameLoader(window.games.selectedGameName)
	}
	$('#loading').stop( true, false ).fadeOut(window.fadeInSpeed)
}

function setCurrentGameLoader(gameName) {
	if(gameName === 'arena') {
		$('#loading img').attr('src', 'img/loader_arena.svg')
	} else {
		$('#loading img').attr('src', 'img/loader.svg')
	}
}

function showAuthLoader() {
	$('#loading').finish()
	setCurrentGameLoader('arena')
	$('#footContent').finish().fadeOut(100, function (e) {
		$('#footContent').addClass('hidden')
		$('#loading').hide().removeClass('hidden').fadeIn(100)
	});
}

function hideAuthLoader() {
	$('#footContent').finish()
	$('#loading').finish().fadeOut(100, function (e) {
		$('#loading').addClass('hidden')
		$('#footContent').hide().removeClass('hidden').fadeIn(100)
	});
}

function setNetworkAvailability(status) {
	if(status==true) {
		$('#head .user .status .text').attr('data-i18n', 'Online');
		$('#head .user .status .icon').removeClass('red').addClass('green');
		if(typeof GoToPage === 'function'){
			GoToPage('/network/online');
		}
	} else {
		$('#head .user .status .text').attr('data-i18n', 'Connecting...');
		$('#head .user .status .icon').removeClass('green').addClass('red');
		if(typeof GoToPage === 'function'){
			GoToPage('/network/offline');
		}
	}
	
	if($('#head .user .status .text').length){
		try {
			whenJqueryFuncAvailable('localize',  function() {
				$('#head .user .status .text').localize();
			});
		} catch(e) {
			console.log(e);
		}
	}
}

function initPasswordEyeListener() {
	$(".eye").bind("mousedown touchstart", function (e) {
		//open pass
		e.stopPropagation()
		$(this).removeClass('eye-closed').addClass('eye-opened')
		$(this).parent().find('input').attr('type', 'text')
	}).bind("mouseup mouseleave touchend", function (e) {
		//close pass
		e.stopPropagation()
		$(this).removeClass('eye-opened').addClass('eye-closed')
		$(this).parent().find('input').attr('type', 'password')
	});
}

function enableBugreports() {
	window.bugReportDisabledMessage = null;
}
function disableBugreports(message) {
	window.bugReportDisabledMessage = message;
}

function enablePowerSave() {
	$('body').addClass('powersaving')
}
function disablePowerSave() {
	$('body').removeClass('powersaving')
}

function initTooltip() {
	$('body [data-tooltip]').each(function(i,elem) {
		try {
			var key = $(this).attr('data-tooltip'),
				result;
			
			if((typeof $(this).attr('data-tooltip-i18n') === 'undefined') || ($(this).attr('data-tooltip-i18n') === true)) {
				result = i18next.t(key);
			} else {
				result = key;
			}
			
			var text = $("<div/>").html(result).text(); //strip tags
			
			$(this).attr('data-tooltip-text', text);
		} catch (e) { console.log(e); }
	});
}

/**Analytics API helpers*/
window.GoToPage = function (url) {
	if(typeof(ym) === "function") {
		ym(window.yandexMetrikaId, 'hit', url)
		if(window.environment !== 'Production') {
			console.log('YM page hit ' + url)
		}
	}
}
window.ReachGoal = function (action, label, page) {
	if(typeof(ym) == "function") {
		let category = page || 'index'
		ym(window.yandexMetrikaId, 'reachGoal', category + '_' + label)
		if(window.environment !== 'Production') {
			console.log('YM event goal sent ' + category + '_' + label)
		}
	}
}
window.reachEventGoal = function (key) {
	const goalYM = eventGoalsYM[key]
	if (goalYM !== undefined) {
		whenAvailable('ym', () => {
			if(window.environment !== 'Production') {
				console.log('YM event goal sent ' + key)
			}
			ym(window.yandexMetrikaId, 'reachGoal', goalYM)
			return true
		})
	}
}
window.reachClickGoal = function (key) {
	const goalYM = clickGoalsYM[key]
	if (goalYM !== undefined && typeof(ym) == "function") {
		ym(window.yandexMetrikaId, 'reachGoal', goalYM)
		if(window.environment !== 'Production') {
			console.log('YM click goal sent ' + key)
		}
		return true
	}
}
function initAnalytics() {
	whenAvailable('environment', ()=>{
		window.yandexMetrikaId = window.environment === 'Production' ? 46073604 : 97064411
		$.get('analytics.html', function (data) {
			let watchHtml = '<noscript><div><img src="https://mc.yandex.ru/watch/'+window.yandexMetrikaId+'" style="position:absolute; left:-9999px;" alt="" /></div></noscript>'
			$('html>body').append(data).append(watchHtml)
		})
		$(document).on('click', '[data-link="profile"]', function(e) {
			reachClickGoal('click_user_profile')
		})
		$(document).on('click', '[data-link="resetProfile"]', function(e) {
			reachClickGoal('click_reset_profile')
		})
	})
}
/**EoF Analytics API helpers*/

function loadJsScript(url) {
	if(!isScriptLoaded(url)) {
		let tag, firstScriptTag
		tag = document.createElement('script')
		tag.src = url
		tag.async = ""
		firstScriptTag = document.getElementsByTagName('script')[0]
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
	}
}

function whenAvailable(name, callback) {
	var interval = 100; // ms
	window.setTimeout(function() {
		if (window[name]) {
			callback(window[name]);
		} else {
			window.setTimeout(arguments.callee, interval);
		}
	}, interval);
}

function whenJqueryFuncAvailable(name, callback) {
	var interval = 50; // ms
	window.setTimeout(function() {
		if (typeof $('body')[name] === "function") {
			callback();
		} else {
			window.setTimeout(arguments.callee, interval);
		}
	}, interval);
}

function isScriptLoaded(url) {
	if (!url) {
		return false
	}
	let scripts = document.getElementsByTagName('script')
	for (var i = scripts.length; i--;) {
		if (scripts[i].src == url) {
			return true
		}
	}
	return false
}

/**images error handler*/
function brokenImage(img) {
	var image = img || this,
		new_image = dummy_image;
	
	if($(image).parent().hasClass('avatar')) {
		new_image = dummy_avatar;
	}
	if($(image).parent().hasClass('newsItem')) {
		new_image = dummy_news_item;
	}
	
	$(image).attr('onerror', '').unbind("error").attr('src', new_image);
}





/**JS TOOLS*/
$.fn.textWidth = function(text, font) {
	if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
	$.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
	return $.fn.textWidth.fakeEl.width();
};
$.fn.hasScrollBar = function() {
	return this.get(0).scrollHeight > this.height();
};
var PrependZeros = function (str, len) {
	if (typeof str === 'number' || Number(str)) {
		str = str.toString();
		return (len - str.length > 0) ? new Array(len + 1 - str.length).join('0') + str : str;
	}
	else {
		for (var i = 0,
			     spl = str.split(' '); i < spl.length; spl[i] = (Number(spl[i]) && spl[i].length < len) ? PrependZeros(spl[i], len) : spl[i], str = (i == spl.length - 1) ? spl.join(' ') : str, i++);
		return str;
	}
};
function isEllipsisActive(jQueryObj) {
	return (  ( jQueryObj.outerWidth() ) <= ( jQueryObj[0].scrollWidth-1 )  );
}
/**EOF JS TOOLS*/


/**TABLE SORTING FEATURES*/
// Takes a table row element and an index and returns the normalized form
// of the sort attribute for the nth-child td. To be more clear, take the
// nth-child td element inside this table row as defined by index (that is
// `:nth-child(idx)`) and then normalize it's sort attribute (if it exists)
// otherwise use the internal text.
function sort_attr ($tr, idx) {
	var $td = $tr.children("div:nth-child(" + idx + ")"),
		sort_attr = $td.attr("sort");
	if (typeof(sort_attr) === "undefined") {
		sort_attr = $td.text();
	}
	sort_attr = sort_attr.trim().toLowerCase();
	return sort_attr;
}
function sortAlphaNum(a,b) {
	var reA = /[^a-zA-Z]/g;
	var reN = /[^0-9]/g;
	var AInt = parseInt(a, 10);
	var BInt = parseInt(b, 10);
	
	if(isNaN(AInt) && isNaN(BInt)){
		var aA = a.replace(reA, "");
		var bA = b.replace(reA, "");
		if(aA === bA) {
			var aN = parseInt(a.replace(reN, ""), 10);
			var bN = parseInt(b.replace(reN, ""), 10);
			return aN === bN ? 0 : aN > bN ? 1 : -1;
		} else {
			return aA > bA ? 1 : -1;
		}
	}else if(isNaN(AInt)){
		return 1;
	}else if(isNaN(BInt)){
		return -1;
	}else{
		return AInt > BInt ? 1 : -1;
	}
}
// Returns a sorting function that can be applied to an array.
function _sort (idx, ascending) {
	return ascending ? function _sorter (a, b) {
		return sortAlphaNum(sort_attr($(a), idx), sort_attr($(b), idx));
	} : function _sorter (a, b) {
		return sortAlphaNum(sort_attr($(b), idx), sort_attr($(a), idx));
	}
}
/**EOF TABLE SORTING FEATURES*/


//разделить тысячи пробелами
function formatSpaces(num){
	var n = num.toString(), p = n.indexOf('.');
	return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i){
		return p<0 || i<p ? ($0+' ') : $0;
	});
}

//Удалить у урла последний "/"
function cutLastSlash(site)
{
	if(typeof site === "string") {
		site = site.replace(/\/$/, "");
	}
	return site;
}

function setCookie(name, value, options) {
	options = options || {};
	
	var expires = options.expires;
	
	if (typeof expires == "number" && expires) {
		var d = new Date();
		d.setTime(d.getTime() + expires * 1000);
		expires = options.expires = d;
	}
	if (expires && expires.toUTCString) {
		options.expires = expires.toUTCString();
	}
	
	value = encodeURIComponent(value);
	
	var updatedCookie = name + "=" + value;
	
	for (var propName in options) {
		updatedCookie += "; " + propName;
		var propValue = options[propName];
		if (propValue !== true) {
			updatedCookie += "=" + propValue;
		}
	}
	
	document.cookie = updatedCookie;
}

function IsJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

function mask(value, symbol = '*') {
	if (value.length < 4) {
		return value;
	}
	const symbolsToHide = value.length * 0.5;
	const offset = Math.floor(symbolsToHide / 2);
	const start = value.slice(0, offset);
	const end = value.slice(-offset);
	return start + symbol.repeat(value.length - symbolsToHide) + end;
}

function maskEmail(email, symbol = '*') {
	try {
		const [value, domain] = email.split('@');
		email = mask(value, symbol);
		if (domain) {
			email += `@${domain}`;
		}
	} catch (e) {
		return email;
	}
	return email;
}

let delay = (function(){
	let timer = 0
	return function(callback, ms){
		clearTimeout (timer)
		timer = setTimeout(callback, ms)
	}
})()


async function getTemplate(file) {
	if(!window.htmlTemplates[file]) {
		await $.get("templates/"+file, template => window.htmlTemplates[file] = template)
	}

	return window.htmlTemplates[file]
}

function initListMenus()
{
	$('[data-list-menu]').each(function () {
		let list = $(this),
			key = list.attr('data-list-menu'),
			button = $('[data-list-menu-open="'+key+'"]')
		button.off('click').on('click', function (e) {
			e.stopImmediatePropagation()
			if(!button.hasClass('locked')) {
				if(button.hasClass('opened')) {
					list.fadeOut(window.fadeOutSpeed, (e) => {
						list.removeClass('visible')
						button.removeClass('opened')
					})
				} else {
					list.fadeIn(window.fadeInSpeed, (e) => {
						list.addClass('visible')
						button.addClass('opened')
					})

				}
			}
		})
	})
}
function serializeJSONIncludingDisabledFields (form) {
	let fields = form.find('[disabled]')
	fields.prop('disabled', false)
	let json = form.serializeJSON(window.serializeConf)
	fields.prop('disabled', true)
	return json
}
