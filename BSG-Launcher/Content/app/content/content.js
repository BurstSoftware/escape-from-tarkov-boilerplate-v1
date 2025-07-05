function fetchMainScreenContent(gameKey, branchName, language) {
	let cacheKey = getMainScreenContentCacheKey(gameKey, branchName, language),
		data = getContentCache(cacheKey)

	cleanMainContentScreen()

	if (null === data) {

		return ApiWebsite.getContent(branchName, window.settings.language, function (response) {
			let data = ApiWebsite.mainScreenContentModel().fromResponse(response)
			setContentCache(cacheKey, data, Date.now()+window.contentCacheInterval)

			renderMainContent(data, gameKey)
		})

	} else {
		renderMainContent(data, gameKey)
	}

	return data
}

function getMainScreenContentCacheKey(gameKey, branchName, language) {
	return gameKey + '_' + branchName + '_mainScreenContent_' + language
}

function cleanMainContentScreen() {
	window.siteConfig = null
	renderSiteConfig()
	important_news.html('')
	$('#main_news [data-pinned-news]').html('')
	$("#main_news>.carousel").html('').fadeOut(0)
}

function renderMainContent(data, gameKey) {
	let config = new SiteConfiguration(data.siteConfig)
	window.siteConfigByGame[gameKey] = config
	window.siteConfig = config
	renderSiteConfig()
	data.pinnedNews = appendPinnedNewsFeedback(config, data.pinnedNews)
	renderImportantNewsList(data.importantNews)
	renderPinnedNews(data.pinnedNews)
	renderMainCarousel(data.carouselList)
}

function appendPinnedNewsFeedback(siteConfig, pinnedNews) {
	if (
		siteConfig?.showFeedbackCard &&
		pinnedNews.items &&
		window.games?.getSelectedGame()?.isBought &&
		window.selectedBranch?.isFeedbackEnabled() &&
		pinnedNews.items.findIndex(article => article.onClick === 'showFeedback(this)') === -1
	) {
		pinnedNews.items.unshift(new Article({
			slug: null,
			title: i18next.t("FeedbackCardTitle"),
			excerpt: i18next.t("FeedbackCardExcerpt"),
			content: null,
			image: window.games.getSelectedPollsIcon(window.settings.language),
			onClick: 'showFeedback(this)'
		}, 'launcher-thumb'))
	}
	return pinnedNews
}
