/** Prepare Data for UI */
const DUMMY_PATCH_NOTE_ICON = 'dummy.jpg'

/** Main Page Pinned News */
function renderPinnedNews(data) {
	$('#main_news [data-pinned-news]').html('')
	let ClassModel = ApiWebsite.articleModel(),
		news = data.items,
		i = 1

	if (news) {
		$.each(news, function (key, val) {
			if (i > 2) {
				return
			}

			let item = val instanceof Article ? val : new ClassModel(val, 'launcher-thumb')

			$('#main_news [data-pinned-news]')
				.append(
					pinnedNewsTpl(
						item.image,
						item.title,
						item.excerpt,
						item.slug,
						i === 1 ? 'click_pinned_l' : 'click_pinned_r',
						item.onClick
					)
				)
				.promise()
				.done(function () {
					$('#main_news .item[data-news="' + item.slug + '"]')
						.stop(true, false)
						.fadeIn(window.fadeInSpeed)
				})
			i++
		})
	}
}

function pinnedNewsTpl(ico, header, small_descr, slug, dataLabel, onClick) {
	let filename = ico ? ico.match(/[^\\/]+$/)[0] : DUMMY_PATCH_NOTE_ICON,
		bgSize = ''
	if (filename === DUMMY_PATCH_NOTE_ICON) {
		bgSize = 'background-size:contain !important; background-color: #0a0809 !important;'
	}
	return '<div class="item box" data-reach-goal data-news="' + slug + '" onclick="' + onClick + '" data-page="index" data-label="' + dataLabel + '" style="display: none;">' +
		'<div class="image" style="background: url(' + ico + ') no-repeat center center scroll; ' + bgSize + '"></div>' +
		'<div class="caption">' +
		'<div class="title">' + header + '</div>' +
		'<div class="text">' + small_descr + '</div>' +
		'</div>' +
		'</div>'
}

/** EoF Main Page Pinned News */

/** News List page */
function clearNewsPage() {
	$('#news_list .carousel').html('')
	$('#news_list .list').html('')
	window.news_carousel = null
	window.news_list = null
	window.appending = false
	window.append_page = 1
}

function showNewsPage() {
	$('#news_content').fadeIn(window.fadeInSpeed)
	if (null == window.news_carousel) {
		initNewsCarousel()
	}
	if (null == window.news_list) {
		appendNewsPage()
	}
	reachClickGoal('click_tab_news')
}

function appendNewsPage() {
	try {
		if (!window.appending) {
			window.appending = true
			let cacheKey = window.games.selectedGameName + '_' + window.selectedBranch?.name + '_pageNews_' + window.settings.language + '_page' + window.append_page,
				data = getContentCache(cacheKey)
			if (null === data) {
				return ApiWebsite.listNews(window.settings.language, window.append_page, onAppendSuccess, onAppendError)
			} else {
				onAppendSuccess(data)
			}
		}
	} catch (e) {
		console.log(e)
		return null
	}
	return null
}

function onAppendSuccess(data) {
	try {
		if (IsJsonString(data)) {
			data = ApiWebsite.articleModel().readListResponse(data)
		}
		let cacheKey = 'pageNews_' + window.settings.language + '_page' + window.append_page
		setContentCache(cacheKey, data, Date.now() + window.contentCacheInterval)
		if (data) {
			news_total = data.totalItems
			window.news_list = $('#news_list .list')
			$.each(data.items, function (key, val) {
				let ClassModel = ApiWebsite.articleModel(),
					item = new ClassModel(val, 'launcher-thumb-sm')
				window.news_list.append(listNewsTpl(item))
			});
			window.append_page++
		}
	} catch (e) {
		console.log(e)
	}

	$('#news_list .list').fadeIn(window.fadeInSpeed)
	window.appending = false
}

function onAppendError(errorCode) {
	try {
		if (window.environment !== "Production") {
			console.error('News request error ' + errorCode)
		}
	} catch (e) {
		console.error(e)
	}
	window.appending = false
}

function scrollAppending() {
	let $newsContent = $('#news_content')
	if ($newsContent.height() + $newsContent.scrollTop() >= parseInt($('#news_content .container').height()) && !appending) {
		if (news_total > $("#news_content #news_list .item").length) {
			appendNewsPage()
		}
	}
}

function listNewsTpl(NewsItem) {
	return '<div id="news_list_item_' + NewsItem.slug + '" class="item">' +
		'<div class="image" data-news="' + NewsItem.slug + '"><img src="' + NewsItem.image + '" onerror="brokenImage(this)" alt="' + NewsItem.title + '" /></div>' +
		'<div class="info">' +
		'<div class="date"><div class="value inline">' + NewsItem.createdMoment.format('DD MMMM YYYY') + '</div><div class="before inline">' + NewsItem.createdMoment.fromNow() + '</div></div> ' +
		'<div class="headline" data-news="' + NewsItem.slug + '"><span>' + NewsItem.title + '</span><i class="icon link"></i></div>' +
		'<div class="small_descr">' + NewsItem.excerpt + '</div>' +
		'<div class="social"><div class="likes" onclick="newsLike(\'' + NewsItem.slug + '\')"><i class="icon like"></i><span class="value">' + NewsItem.likesCount + '</span></div></div>' +
		'</div>' +
		'</div>'
}

/** EoF News List page */

/** News View page */

function showNews(slug) {
	try {
		setMainMenuButtonActive('news')
		hideAllPages(() => {

			renderBackground('news')
			GoToPage('/page/news/' + slug)

			let cacheKey = window.games.selectedGameName + '_' + window.selectedBranch?.name + '_newsViewBySlug_' + slug + '_' + window.settings.language,
				item = getContentCache(cacheKey)
			if (null === item) {
				ApiWebsite.viewNews(window.settings.language, slug, function (response) {
					let item = ApiWebsite.articleModel().readViewResponse(response, 'normal')
					if (item) {
						setContentCache(cacheKey, item, Date.now() + window.contentCacheInterval)
						renderNewsItem(item)
					}
				})
			} else {
				renderNewsItem(item)
			}

			current_page = 'news_item'

		})

	} catch (e) {
		console.log(e)
	}
}

function renderNewsItem(NewsItem) {
	whenJqueryFuncAvailable('localize', function () {
		let websiteUrl = getCurrentSiteUrl() + NewsItem.getRoute(),
			share_list = getShareList(websiteUrl, NewsItem.title, NewsItem.image, NewsItem.excerpt),
			cachedLikes = newsReadLike(NewsItem.slug)
		if (null !== cachedLikes) {
			NewsItem.likesCount = cachedLikes
		}
		$('#news_item').attr('data-id', NewsItem.slug).html('<div class="container small">' +
			'<div class="breadcrumbs"><div class="back_button" data-view-page="news"><i class="icon back"></i><span data-i18n="Back">' + i18next.t("Back") + '</span></div></div>' +
			'<div class="headline">' + NewsItem.title + '</div>' +
			'<div class="info">' +
			'<div class="date inline">' +
			'<div class="value inline">' + NewsItem.createdMoment.format('DD MMMM YYYY') + '</div>' +
			'<div class="before inline">' + NewsItem.createdMoment.fromNow() + '</div>' +
			'</div>' +
			'<div class="likes inline" onclick="newsLike(\'' + NewsItem.slug + '\')">' +
			'<i class="icon like"></i>' +
			'<span class="value">' + NewsItem.likesCount + '</span>' +
			'</div>' +
			'</div>' +
			'<div class="image newsItem"><img src="' + NewsItem.image + '" alt="' + NewsItem.title + '" onerror="brokenImage(this)" /></div>' +
			'<div class="content">' + NewsItem.content + '</div>' +
			'<div class="links">' +
			'<div class="left">' +
			'<div class="back_button" data-view-page="news"><i class="icon back"></i><span data-i18n="Back">' + i18next.t("Back") + '</span></div>' +
			'</div>' +
			'<div class="right">' +
			'<a href="' + websiteUrl + '"><span data-i18n="Watch on website">' + i18next.t("Watch on website") + '</span><i class="icon next"></i></a>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'<div class="splitter"></div>' +
			'<div class="container small">' +
			'<div class="sharing">' +
			'<div class="left">' +
			'<div class="comments"></div>' +
			'<div class="likes" onclick="newsLike(\'' + NewsItem.slug + '\')">' +
			'<i class="icon like"></i>' +
			'<span class="value">' + NewsItem.likesCount + '</span>' +
			'<span data-i18n="Liked"></span>' +
			'</div>' +
			'</div>' +
			'<div class="right">' +
			'<div class="sharer"><i class="icon share"></i><span data-i18n="Share">' + i18next.t("Share") + '</span>' +
			'<ul class="hidden">' + share_list + '</ul>' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>')
			.promise().then(function (e) {
			$('#news_item>.container>.sharing>.right>.sharer').off('click').on('click', function (e) {
				let list = $('#news_item>.container>.sharing>.right>.sharer>ul')
				if (list.hasClass('hidden')) {
					list.hide().removeClass('hidden').fadeIn(window.fadeInSpeed)
				} else {
					list.fadeOut(window.fadeOutSpeed, function (e) {
						list.addClass('hidden')
					});
				}
			});
			$('#news_item').localize().fadeIn(window.fadeInSpeed)
		});
	});
}

function newsLike(slug) {
	let cacheKey = window.games.selectedGameName + '_' + window.selectedBranch?.name + '_newsLike_' + slug,
		data = getContentCache(cacheKey)
	if (null === data) {
		GoToPage('/like/news/' + slug)
		ApiWebsite.likeNews(slug, function (data) {
			data = ApiWebsite.articleModel().readLikeResponse(data)
			if (data) {
				setContentCache(cacheKey, data, Date.now() + window.contentCacheInterval)
				$('[onclick="newsLike(\'' + slug + '\')"]').find('.value').text(data.total)
				setNewsLikeValueEverywhere(slug, data.total)
			}
		}, likeErrorCallback)
	} else {
		$('[onclick="newsLike(\'' + slug + '\')"]').find('.value').text(data.total)
	}
}

function likeErrorCallback(httpCode, errorCode, errorArgs) {
	errorArgs = errorArgs ? JSON.parse(errorArgs) : errorArgs
	showCodeError(
		errorCode,
		"error_msg_" + errorCode,
		errorArgs
	)
}

function newsReadLike(slug) {
	let cacheKey = window.games.selectedGameName + '_' + window.selectedBranch?.name + '_newsLike_' + slug,
		data = getContentCache(cacheKey)
	if (data && data.total) {
		return data.total
	}
	return null
}

function setNewsLikeValueEverywhere(slug, newValue) {
	let cacheKeyView = window.selectedBranch.name + '_newsViewBySlug_' + slug + '_' + window.settings.language,
		cacheKeyLike = window.selectedBranch.name + '_newsLike_' + slug + '_' + window.settings.language

	for (let cacheKeyFor in window.contentCache) {
		let val = window.contentCache[cacheKeyFor].data
		if (cacheKeyFor === cacheKeyView && val && val.likesCount) {
			window.contentCache[cacheKeyFor].data.likesCount = newValue
		}
		if (cacheKeyFor === cacheKeyLike && val && val.total) {
			window.contentCache[cacheKeyFor].data.total = newValue
		}
		if (cacheKeyFor.startsWith(window.selectedBranch.name + '_pageNews_' + window.settings.language)) {
			let parsedData = ApiWebsite.articleModel().readListResponse(window.contentCache[cacheKeyFor].data),
				index = parsedData.items.findIndex(row => row.slug === slug)
			if (index !== -1) {
				window.contentCache[cacheKeyFor].data.items[index].likesCount = newValue
			}
		}
	}
}

/** EoF News View page */
