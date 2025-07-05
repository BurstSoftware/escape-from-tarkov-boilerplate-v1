
/*YOUTUBE API*/
function pauseAllVideos() {
	try {
		$('iframe').each(function(){
			this.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*')
		});
	} catch(e) {
		console.log(e);
	}
}

function initVideoHandler() {
	let YT_api_url = "https://www.youtube.com/iframe_api";
	if(!isScriptLoaded(YT_api_url)) {
		let tag, firstScriptTag;
		tag = document.createElement('script');
		tag.src = YT_api_url;
		tag.async = "";
		firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}
}


////создание плейера для каждого видео
function onYouTubeIframeAPIReady() {
	YT_ready = true;
}

////в зависимости от состояния плейера
////показываем и скрываем главное меню
function onPlayerStateChange(event) {
	try {
		switch(event.data) {
			case YT.PlayerState.ENDED: onYTPlayerEnded(event); break;
			case YT.PlayerState.PLAYING: onYTPlayerPlaying(event); break;
			case YT.PlayerState.PAUSED: break;
			case YT.PlayerState.BUFFERING: break;
			case YT.PlayerState.CUED: break;
			default:  break;
		}
	} catch(e) {
		console.log(e);
	}
}

function onYTPlayerEnded(event) {
	try {
		document.webkitExitFullscreen()
		$(event.target.getIframe()).addClass('hidden')
		if(news_carousel) {
			news_carousel.slick('slickPlay')
		}
		if(main_carousel) {
			main_carousel.slick('slickPlay')
		}
	} catch (e) {
		console.log(e)
	}
}

function onYTPlayerPlaying(event) {
	try {
		$(event.target.getIframe()).removeClass('hidden')
		if(news_carousel) {
			news_carousel.slick('slickPause')
		}
		if(main_carousel) {
			main_carousel.slick('slickPause')
		}
	} catch (e) {
		console.log(e)
	}
}

function onPlayerReady(event) {
	event.target.playVideo();
}

function playVideo(div_id) {
	try {
		if(YT_ready) {
			if(video_players[div_id]) {
				if(typeof video_players[div_id].playVideo == 'function')
				{
					video_players[div_id].playVideo();
				}
			} else {
				createIframe(div_id);
			}
		}
	} catch(e) {
		createIframe(div_id);
		console.log(e);
	}
}

function createIframe(div_id) {
	try {
		var play_button = '#' + div_id + ' .play',
			videoId = $(play_button).attr('data-video');
		if(!$(div_id + ' iframe').length) {
			$('<div />', {
				id: "YT_"+div_id,
				class: "hidden",
				allowscriptaccess: "always"
			}).appendTo('#'+div_id);

			video_players[div_id] = new YT.Player("YT_" + div_id, {
				width: '478',
				height: '269',
				videoId: videoId,
				playerVars: {
					modestbranding: 0,
					rel: 0,
					showinfo: 0
				},
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange
				}
			});
		}
	} catch(e) {
		console.log(e);
	}
}
/*EOF YOUTUBE API*/
