const PARTICIPANT_STATUSES = {
	0: 'notApplied',
	1: 'applied',
	2: 'approved',
	3: 'suspended'
}
const FEEDBACK_BEHAVIOR_DISABLED = 'disabled'
const FEEDBACK_BEHAVIOR_ENABLED = 'enabled'
const FEEDBACK_BEHAVIOR_REQUIRED = 'required'

class Branch {
	constructor(data) {
		this.feedbackBehavior = data.feedbackBehavior || FEEDBACK_BEHAVIOR_DISABLED
		this.gameVersion = data.gameVersion || null
		this.gameVersionToUpdate = data.gameVersionToUpdate || null
		this.isActive = data.isActive || false
		this.isDefault = data.isDefault || false
		this.name = data.name || null
		this.participantStatus = data.participantStatus || PARTICIPANT_STATUSES[0]
		this.siteUri = data.siteUri || null
		this.status = data.status || 0
		this.gameState = data.gameState || null
		this.gameUpdateState = data.gameUpdateState || 'idle'
		this.progress = data.progress || {
			current: 0,
			currentSpeed: -1,
			secondsLeft: -1,
			total: 0
		}
	}

	getParticipantStatusKey() {
		let status = Object.keys(PARTICIPANT_STATUSES).find(key => PARTICIPANT_STATUSES[key] === this.participantStatus)
		return parseInt(status) ?? 0
	}

	isFeedbackEnabled() {
		return this.feedbackBehavior !== FEEDBACK_BEHAVIOR_DISABLED
	}
}

class Game {
	constructor(data) {
		this.name = data.name || null
		this.fullName = data.fullName || null
		this.gameEdition = data.gameEdition || null
		this.gameEditionTitle = data.gameEditionTitle || null
		this.purchaseRegion = data.purchaseRegion || null
		this.authRegionByIp = data.authRegionByIp || null
		this.selectedBranchName = data.selectedBranch || null
		this.isBought = data.isBought || false
		this.isSelected = data.isSelected || false
		this.isLegalCheckRequired = data.isLegalCheckRequired || false
		this.branches = []
		if (data.branches) {
			data.branches.forEach((value) => this.branches.push(new Branch(value)))
		}
	}

	getSelectedBranch() {
		return this.branches.find((branch) => branch.name === this.selectedBranchName)
	}
}

class Games {
	constructor() {
		this.selectedGameName = null
		this.list = {}
	}

	setList(games, force) {
		games.forEach((value) => {
			let oldGame = this.getGame(value.name),
				newGame = new Game(value)
			if (JSON.stringify(newGame) !== JSON.stringify(oldGame) || force) {
				this.onGameChange(oldGame, newGame, force)
			}
		})
	}

	onGameChange(oldGame, newGame, force) {
		let selectedGameIsChanged = newGame.isSelected && this.selectedGameName !== newGame.name,
			selectedBranchChanged = newGame.isSelected && window.selectedBranch?.name !== newGame.getSelectedBranch()?.name,
			forceRedraw = selectedGameIsChanged || selectedBranchChanged || force

		this.setGame(newGame)

		if (newGame.isSelected && !newGame.isLegalCheckRequired) {
			this.selectedGameName = newGame.name
			setCurrentGameLoader(this.selectedGameName)
			if (typeof OnSelectedGameUpdated === 'function') {
				OnSelectedGameUpdated(oldGame, newGame, forceRedraw)
			}

			window.selectedBranch = newGame.getSelectedBranch()
			if (forceRedraw && typeof OnSelectedBranchChange === 'function') {
				OnSelectedBranchChange(newGame.branches)
			}
		}

		if (typeof OnGameUpdated === 'function') {
			OnGameUpdated(oldGame, newGame)
		}

		if (forceRedraw && !newGame.isLegalCheckRequired) {
			redrawLanguage(window.settings.language)
		}
	}

	getGame(name) {
		return this.list[name] || new Game({})
	}

	setGame(Game) {
		return this.list[Game.name] = Game
	}

	getSelectedGame() {
		return Object.values(this.list).find((game) => game.isSelected === true) || new Game({})
	}

	getCurrentGameBranchByName(name) {
		return this.getSelectedGame().branches.find((branch) => branch.name === name)
	}

	getSelectedBranch() {
		return this.getSelectedGame()?.getSelectedBranch()
	}

	getSelectedPollsIcon(lang) {
		if(lang !== 'ru') {
			lang = 'en'
		}
		return this.selectedGameName === 'eft' ? 'img/polls/eft_ico_'+lang+'.png' : 'img/polls/arena_ico_'+lang+'.png'
	}
}

class GeoInfo {
	constructor(data) {
		this.country = data.country || null
		this.continent = data.continent || null
	}
}

class Account {
	constructor(data) {
		this.id = data.id || 0
		this.nickname = data.nickname || null
		this.avatar = data.avatar || null
		this.geoInfo = new GeoInfo(data.geoInfo || {})
	}
}

class Settings {
	constructor(data) {
		this.language = data.language || 'en'
		this.account = new Account(data.account || {})
		this.selectedGame = data.selectedGame || null
		this.supportNotificationsCount = data.supportNotificationsCount || 0
		this.authCenterUri = data.authCenterUri || null
		this.tempFolder = data.tempFolder || null
		this.configuration = data.configuration || null
		this.gamesRootDir = data.gamesRootDir || null
		this.closeBehavior = data.closeBehavior || null
		this.gameStartBehavior = data.gameStartBehavior || null
		this.keepLoggedIn = data.keepLoggedIn || null
		this.launchMinimized = data.launchMinimized || null
		this.launchOnStartup = data.launchOnStartup || null
		this.login = data.login || null
		this.ipRegion = data.ipRegion || null
		this.maxBugReportSize = data.maxBugReportSize || 15 * 1024 * 1024
		this.maxDownloadSpeed = data.maxDownloadSpeed || null
		this.maxUploadSpeed = data.maxUploadSpeed || null
		this.queueAutoLogIn = data.queueAutoLogIn || null
		this.queueNotifyWithSound = data.queueNotifyWithSound || null
		this.saveLogin = data.saveLogin || null
		this.volumeValue = data.volumeValue || null
	}
}

class SiteConfiguration {
	constructor(data) {
		this.headerLinks = data?.headerLinks || null
		this.showFeedbackCard = !!data?.showFeedbackCard || false
		this.isMatchingConfigEnabled = !!data?.isMatchingConfigEnabled || false
		this.etsMaxProfileLevel = data?.etsMaxProfileLevel || null
		this.etsMaxGamePurchaseMonths = data?.etsMaxGamePurchaseMonths || null
		this.isArenaFreeWeekendEnabled = !!data?.isArenaFreeWeekendEnabled || false
		this.arenaDiscountLabelText = data?.arenaDiscountLabelText || ''
		this.arenaDiscountLabelIsEnabled = !!data?.arenaDiscountLabelIsEnabled || false
		this.eftDiscountLabelText = data?.eftDiscountLabelText || ''
		this.eftDiscountLabelIsEnabled = !!data?.eftDiscountLabelIsEnabled || false
		this.discountLabelStart = data?.discountLabelStart || null
		this.discountLabelEnd = data?.discountLabelEnd || null
	}

	getDiscountLabel(game) {
		let now = moment(),
			start = moment(this.discountLabelStart),
			end = moment(this.discountLabelEnd),
			isInRange = now >= start && now <= end,
			isEnabled = game === 'eft' ? this.eftDiscountLabelIsEnabled : this.arenaDiscountLabelIsEnabled

		if(isInRange && isEnabled) {
			return game === 'eft' ? this.eftDiscountLabelText : this.arenaDiscountLabelText
		}
	}
}

var langs = {
		ru: 'Русский',
		en: 'English',
		de: 'Deutsch',
		it: 'Italiano',
		es: 'Español',
		mx: 'Español mexicano',
		fr: 'Français',
		pt: 'Português',
		tr: 'Türkçe',
		zh: '中文',
		cs: 'Čeština'
	},
	langIsRendering = false,
	browserVisible = false,
	environment = null,
	settings = new Settings({}),
	games = new Games({}),
	supportConfiguration = {
		categories: [],
		gameLogsFreshnessSec: 0,
		gameLogsSizeLimit: 0
	},
	siteConfig = null,
	siteConfigByGame = {},
	windowIsDragging = false,
	selectFolderGameUpdateStates = ["idle"],
	selectFolderGameStates = ["installRequired", "updateRequired", "repairRequired", "reinstallRequired", "readyToGame"],
	checkForUpdateGameUpdateStates = ["idle"],
	checkForUpdateGameStates = ["updateRequired", "readyToGame"],
	selectBranchGameUpdateStates = ["idle", "pause", "stopped"],
	selectBranchGameStates = ["installRequired", "updateRequired", "repairRequired", "reinstallRequired", "readyToGame"],
	sendFeedbackGameUpdateStates = ["idle", "pause", "stopped"],
	sendFeedbackGameStates = ["updateRequired", "repairRequired", "reinstallRequired", "readyToGame"],
	launcher_version = "",
	game_edition = "",
	game_version = "",
	game_region = "",
	ets_tester_status = null,
	bugReportDisabledMessage = null,
	volume = 50,
	sm2distr = {
		"debug": "/js/plugins/sm2/soundmanager2.js",
		"default": "/js/plugins/sm2/soundmanager2-nodebug-jsmin.js"
	},
	soundFolder = 'sound',
	sounds = null,
	editions = {
		"not_purchased": '<span class="error" data-i18n="Game not purchased!"></span>',
		"standard": "Standard Edition",
		"arena": "Arena Standard",
		"ryzhy": "Ryzhy Standard",
		"left_behind": "Left Behind Edition",
		"prepare_for_escape": "Prepare for Escape Edition",
		"edge_of_darkness": "Edge of Darkness Limited Edition",
		"press_edition": "Press Edition",
		"tournament": "Tournament Edition",
		"tournament_live": "Tournament Edition",
	},
	selectedBranch = null,
	current_page = 'main',
	pageParams = {
		game: {
			eft: {
				branch: {
					default: {
						main: {
							id: "main_content",
							imgPos: "center top",
							img: "img/main_art.jpg"
						},
						news: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art.jpg"
						},
						news_item: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art.jpg"
						},
						settings: {
							id: "settings_content",
							imgPos: "right top",
							img: "img/settings_art.jpg"
						},
						ets: {
							id: "ets_content",
							imgPos: "right top",
							img: "img/settings_art_ets.jpg"
						}
					},
					ets: {
						main: {
							id: "main_content",
							imgPos: "center top",
							img: "img/main_art_ets.jpg"
						},
						news: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art_ets.jpg"
						},
						news_item: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art_ets.jpg"
						},
						settings: {
							id: "settings_content",
							imgPos: "right top",
							img: "img/settings_art_ets.jpg"
						},
						ets: {
							id: "ets_content",
							imgPos: "right top",
							img: "img/settings_art_ets.jpg"
						}
					},
					tournament: {
						main: {
							id: "main_content",
							imgPos: "center top",
							img: "img/main_art_tournament.jpg"
						},
						news: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art_tournament.jpg"
						},
						news_item: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art_tournament.jpg"
						},
						settings: {
							id: "settings_content",
							imgPos: "right top",
							img: "img/settings_art_tournament.jpg"
						},
						ets: {
							id: "ets_content",
							imgPos: "right top",
							img: "img/settings_art_tournament.jpg"
						}
					}
				},
				vk_group_id: 89771130,
				tw_link: 'https://twitter.com/bstategames?ref_src=twsrc%5Etfw'
			},
			arena: {
				branch: {
					default: {
						main: {
							id: "main_content",
							imgPos: "center 1px",
							img: "img/arena_art.jpg"
						},
						news: {
							id: "news_content",
							imgPos: "right top",
							img: "img/settings_art_arena.jpg"
						},
						news_item: {
							id: "news_content",
							imgPos: "right top",
							img: "img/news_art.jpg"
						},
						settings: {
							id: "settings_content",
							imgPos: "right top",
							img: "img/settings_art_arena.jpg"
						},
						ets: {
							id: "ets_content",
							imgPos: "right top",
							img: "img/settings_art_ets.jpg"
						}
					},
				},
				vk_group_id: 218983927,
				tw_link: 'https://twitter.com/tarkovarena'
			}
		}
	},
	game_dir_pregmatch = /^[\\\?]*/g,
	w_maximize = $("#window_buttons>.maximize"),
	w_minimize = $("#window_buttons>.minimize"),
	w_close = $("#window_buttons>.close"),
	main_menu = $('#head>.wrap .menu>ul'),
	main_menu_collapse_width = null,
	main_menu_game_item = main_menu.find('.game'),
	htmlTemplates = {},
	vkApiTransportLoading = false,
	twApiTransportLoading = false,
	vkTimerRepeaterId = null,
	contentCache = {},
	contentCacheInterval = 86400000, //in milliseconds 1 day
	fadeOutSpeed = 200,
	fadeInSpeed = 400,
	contentFadingTimer = null,
	main_carousel = null,
	news_carousel = null,
	news_list = null,
	news_total = null,
	append_page = 1,
	appending = false,
	important_news = $("#important_news>.wrap"),
	important_news_marquee_speed = 40,
	s2opt = {
		minimumResultsForSearch: -1,
		placeholder: '',
		language: "en"
	},
	main_slick_config = {
		dots: false,
		infinite: true,
		speed: 500,
		autoplay: false,
		autoplaySpeed: 10000,
		fade: true,
		cssEase: 'linear',
		prevArrow: '<div class="slick-prev"></div>',
		nextArrow: '<div class="slick-next"></div>'
	},
	news_slick_config = {
		dots: true,
		infinite: true,
		speed: 500,
		autoplay: false,
		autoplaySpeed: 10000,
		fade: true,
		cssEase: 'linear',
		prevArrow: '<div class="slick-prev"></div>',
		nextArrow: '<div class="slick-next"></div>',
		appendDots: '#news_list .slick-slide .caption'
	},
	YT_ready = false,
	video_players = [],
	game_main = $('#game_main'),
	head_user_block = $('#head .wrap .user'),
	mobile_menu = $('#mobile_menu'),
	user_menu = $('#user_menu'),
	game_installer = $('#game_installing'),
	game_install_button = $("#game_main [data-main-button]"),
	top_button_select_folder = game_main.find('.top_buttons .select-folder'),
	top_button_check_updates = game_main.find('.top_buttons .check-updates'),
	game_time_left = $('#game_time_left'),
	game_size_total = $('#game_size_total'),
	game_current_speed = $('#game_current_speed'),
	progress_bar = $('#game_installing .progress .slider'),
	api_route = 'launcher/',
	authCenterUri = 'https://www.escapefromtarkov.com',
	authCenterLinks = {
		root: '/',
		resetPassword: '/password-recovery?utm_source=launcher&utm_medium=link_reset_password&utm_campaign=dropdown',
		registration: '/registration?utm_source=launcher&utm_medium=link&utm_campaign=footer',
		legalAgreements: '/legal-agreements?utm_source=launcher&utm_medium=link&utm_campaign=footer'
	},
	main_menu_template = {
		root: '',
		profile: '/profile?utm_source=launcher&utm_medium=link_profile&utm_campaign=dropdown',
		resetProfile: '/reset-game-profile?utm_source=launcher&utm_medium=link_reset_game_profile&utm_campaign=dropdown',
		preorder: '/preorder-page',
		support: '/support?utm_source=launcher&utm_medium=link_support&utm_campaign=menu',
		expansions: '/expansions?utm_source=launcher&utm_medium=menu&utm_campaign=head&utm_term=expansions_link'
	},
	main_menu_links = {...main_menu_template},
	resize_timeout = false,
	resize_time,
	resize_delta = 200,
	autoUpdateInterval = 30 * 60 * 1000,
	dummy_image = 'img/dummy.jpg',
	dummy_avatar = 'img/avatar.jpg',
	dummy_news_item = 'img/dummyNewsItem.jpg',
	serializeConf = {
		checkboxUncheckedValue: 'false',
		parseBooleans: true,
		parseAll: true
	},
	pushstreams = [],
	pushstreamBuffer = [],
	pushstreamConfig = {
		urlPrefixWebsocket: '/push/notifier/getwebsocket',
		host: "wstream.escapefromtarkov.com",
		port: window.location.port,
		modes: "websocket",
		// channelsByArgument: true,
		// channelsArgument: 'id', //this is the default value, you have to change it to be the same value used on push_stream_channels_path directive
		messagesPublishedAfter: 5, //Getting old messages
		messagesControlByArgument: true //Getting old messages
	},
	pushstreamWaitUntilRefresh = [0, 5 * 60 * 1000],
	errorMessageLangPrefix = 'error_msg_',
	jsIntervals = [],
	playButtonForceLocked = false,
	playButtonLockSeconds = false,
	//http://ionden.com/a/plugins/ion.rangeSlider/api.html,
	//simply can be customized with data-{key} html5 attributes
	ionSliderDefaultConfig = {
		type: "single",
		skin: "eft",
		hide_min_max: true,
		hide_from_to: true,
		onStart: function (data) {
			var id = data.input.attr('id'),
				label = $('label[for="' + id + '"]');
			if (label.length) {
				label.find('[data-value]').text(data.from_pretty + "%");
			}
			if (typeof setVolume === 'function') {
				setVolume(data.from);
			}
		},
		onChange: function (data) {
			var id = data.input.attr('id'),
				label = $('label[for="' + id + '"]');
			if (label.length) {
				label.find('[data-value]').text(data.from_pretty + "%");
			}
			if (typeof setVolume === 'function') {
				setVolume(data.from);
			}
		},
		onFinish: function (data) {
			if (typeof playSound === 'function') {
				playSound("volume_check.wav");
			}
		},
	},
	CurrentFeedback = null,
	feedbackAnswersRequiredTypes = [2, 3, 4],
	feedbackTextInputMinLen = 0,
	feedbackTextInputMaxLen = 255,
	feedbackTextAreaMinLen = 0,
	feedbackTextAreaMaxLen = 500,
	yandexMetrikaId = null,
	clickGoalsYM = Object.freeze({
		click_tab_eft: 'click_tab_eft',
		click_tab_arena: 'click_tab_arena',
		click_buy_eft: 'click_buy_eft',
		click_buy_arena: 'click_buy_arena',
		click_download_eft: 'click_download_eft',
		click_download_arena: 'click_download_arena',
		click_update_eft: 'click_update_eft',
		click_update_arena: 'click_update_arena',
		click_launch_eft: 'click_launch_eft',
		click_launch_arena: 'click_launch_arena',
		click_user_profile: 'click_user_profile',
		click_reset_profile: 'click_reset_profile',
		click_activate_code_profile: 'click_activate_code_profile',
		click_logout_profile: 'click_logout_profile',
		click_activate_code: 'click_activate_code',
		click_tab_news: 'click_tab_news',
		click_create_account: 'click_create_account'
	}),
	eventGoalsYM = Object.freeze({
		login: 'login'
	})
;
