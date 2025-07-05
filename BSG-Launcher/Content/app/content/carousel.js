function initNewsCarousel() {
	try {
		let cacheKey = window.games.selectedGameName + '_' + window.selectedBranch?.name+'_carousel_' + window.settings.language,
			data = getContentCache(cacheKey)
		if (null === data) {
			return ApiWebsite.getSlides(window.settings.language, function (result) {
				data = ApiWebsite.slideModel().readListResponse(result)
				if (data) {
					setContentCache(cacheKey, data, Date.now() + window.contentCacheInterval)
					renderNewsCarousel(data)
				}
			})
		} else {
			renderNewsCarousel(data)
		}
	} catch (e) {
		console.log(e)
	}
	return null
}

function renderMainCarousel(data) {
	if(!data) {
		return
	}
	$("#main_news>.carousel").html(getCarouselHtml(data, "video_", "launcher-thumb-sm"))
	main_carousel = $('#main_news .carousel>ul')

	main_carousel.on('init', (event, slick) => {
		$("#main_news>.carousel").stop(true,false).fadeIn(window.fadeInSpeed)
		slick.reinit()
	})
	main_carousel.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
		$.each(main_carousel.find('li.slick-slide'), function (index, value) {
			$(value).find('iframe').addClass('hidden')
			if (video_players[$(value).attr('id')] && $(value).find('iframe').length) {
				try {
					video_players[$(value).attr('id')].pauseVideo()
				} catch (e) {
					console.log(e)
				}
			}
		})
	})
	main_carousel.slick(main_slick_config)
	initVideoHandler()
}

function renderNewsCarousel(data) {
	try {
		$("#news_list>.carousel").html(getCarouselHtml(data, "news_video_", "launcher-thumb"))
		news_carousel = $('#news_list .carousel>ul')

		news_carousel.on('init', (event, slick) => {
			$("#news_list>.carousel").stop(true,false).fadeIn(window.fadeInSpeed)
			slick.reinit()
		})
		news_carousel.on('beforeChange', function (event, slick, currentSlide, nextSlide) {
			$.each(news_carousel.find('li.slick-slide'), function (index, value) {
				$(value).find('iframe').addClass('hidden')
				if (video_players[$(value).attr('id')] && $(value).find('iframe').length) {
					try {
						video_players[$(value).attr('id')].pauseVideo()
					} catch (e) {
						console.log(e)
					}
				}
			})
			$('li', $('#news_list .slick-dots')).removeClass('slick-active').attr('aria-hidden', true)
		})
		news_carousel.on('afterChange', function (event, slick, currentSlide) {
			$('#news_list .slick-dots').each(function () {
				$('li', $(this)).eq(currentSlide).addClass('slick-active').attr('aria-hidden', false)
			})
		})
		news_carousel.slick(news_slick_config)
	} catch (e) {
		console.log(e)
	}
}

function getCarouselHtml(data, idKey, thumbSize) {
	let carousel = $("<ul class='slick-slider'></ul>")
	$.each(data, function (key, rawItem) {
		let ClassModel = ApiWebsite.slideModel(),
			item = new ClassModel(rawItem, thumbSize)
		carousel.append(getCarouselItemHtml(
			item.title,
			item.providerData,
			item.image,
			item.provider,
			idKey + key + window.settings.language
		))
	})
	return carousel
}

function getCarouselItemHtml(title, link, image, type, uniqueKey) {
	return $("<li id='" + uniqueKey + "' class='slick-slide'></li>").html(
		'<img src="' + image + '" onerror="$(this).remove()" alt="' + title + '" />' +
		'<div class="caption">' + title + '</div>' +
		getCarouselItemLink(type, link, uniqueKey)
	)
}

function getCarouselItemLink(type, link, uniqueKey) {
	if (typeof type === "undefined" || type === 'youtube') {
		return '<div class="play" onclick="playVideo(\'' + uniqueKey + '\')" data-video="' + link + '"></div>'
	} else if (type === 'link') {
		return '<a class="play out" href="' + link + '" target="_blank"></a>'
	} else {
		return '<a class="play" href="' + link + '" target="_blank"></a>'
	}
}
