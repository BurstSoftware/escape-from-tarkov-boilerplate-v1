function renderImportantNewsList(data) {
	important_news.html('')
	$.each( data, function( key, val ) {
		let ClassModel = ApiWebsite.importantNewsModel(),
			item = new ClassModel(val)
		renderImportantNewsItem(item)
	})
	reCalculateImportantNews()
}
function renderImportantNewsItem(val) {
	try {
		const label = val.variant === 'danger' ? `<i class="icon important"></i><span class="label" data-i18n="Important!">${ i18next.t('Important!') }</span>` : ''

		const linkTagOpen = val.url?.length ? `<a class="link corner_icon" href="${val.url}">` : `<div class="link">`;
		const linkTagClose = val.url?.length ? `</a>` : `</div>`;

		const content = `
		  	<div class="item item_${ val.variant }" style="display: none" data-important-news="${ val.id }">
				${ linkTagOpen }
					${ label }
					<span class="text">
						<span><span>${ val.message }</span></span>
					</span>
				${ linkTagClose }
				<div class="blurer"></div>
		  	</div>
		`
		important_news.html(content)

		if(
			typeof val.disableBugreports !== 'undefined' &&
			(
				val.disableBugreports === '1' ||
				val.disableBugreports === true
			)
		) {
			disableBugreports(val.message)
		}
	} catch (e) {
		console.log(e)
	}
}

function reCalculateImportantNews() {
	whenJqueryFuncAvailable('localize',  () => {
		Blur("#important_news .item .blurer")
		important_news.find('.item').fadeIn(window.fadeInSpeed)
		calculateImportantResponsive()
		$(window).trigger('resize')
	})
}


function calculateImportantResponsive() {
	let text = $('#important_news .item .text'),
		text_span = text.find('span span'),
		cont_width = text.width(),
		text_width = text_span.textWidth()

	if (cont_width < text_width) {
		//calc marquee speed
		let calc_text_width = text_span.width() + parseInt(text_span.css('padding-left')),
			animationTime = calcImportantNewsMarqueeSpeedTime(calc_text_width, cont_width)
		text_span.css('animation', 'marquee '+animationTime+'s linear infinite')
		$('#important_news .item .text').addClass('marquee')
	} else {
		$('#important_news .item .text').removeClass('marquee')
	}
}

function calcImportantNewsMarqueeSpeedTime(textWidth, contWidth) {
	let s = textWidth-contWidth
	return s / window.important_news_marquee_speed
}


function refreshSupportBubble(count) {
	if(0<parseInt(count)) {
		if(9<count) {
			count = 9
		}
		if($('#head .menu .support>.bubble').length) {
			$('#head .menu .support>.bubble>span').text(count)
		} else {
			$('#head .menu .support').append('<a href="'+getCurrentSiteUrl()+"/support/request"+'" class="bubble" style="display:none;"><span>'+count+'</span></a>')
			$('#head .menu .support .bubble').fadeIn(window.fadeInSpeed)
		}
	} else {
		$('#head .menu .support .bubble').fadeOut(window.fadeOutSpeed, function (e) {
			$(this).remove()
		})
	}
}
