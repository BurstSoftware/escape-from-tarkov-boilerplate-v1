function initSound() {
	try {
		var sm2Url = window.sm2distr.default,
			debugMode = false;
		if (window.environment !== 'Production') {
			sm2Url = window.sm2distr.debug;
			debugMode = true;
		}
		if (!isScriptLoaded(sm2Url)) {
			var tag, firstScriptTag;
			tag = document.createElement('script');
			tag.src = sm2Url;
			tag.async = true;
			firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
		}
		
		whenAvailable('soundManager', function () {
			soundManager.setup({
				url: window.soundFolder,            // the directory where SM2 can find the flash movies (soundmanager2.swf, soundmanager2_flash9.swf and debug versions etc.) Note that SM2 will append the correct SWF file name, depending on flashVersion and debugMode settings.
				allowScriptAccess: 'always',	    // for scripting the SWF (object/embed property), 'always' or 'sameDomain'
				bgColor: '#ffffff',	                // SWF background color. N/A when wmode = 'transparent'
				consoleOnly: true,                  // if console is being used, do not create/write to #soundmanager-debug
				flashVersion: 9,	                // flash build to use (8 or 9.) Some API features require 9.
				flashPollingInterval: null,	        // msec affecting whileplaying/loading callback frequency. If null, default of 50 msec is used.
				forceUseGlobalHTML5Audio: false,    // if true, a single Audio() object is used for all sounds - and only one can play at a time.
				html5PollingInterval: null,         // msec affecting whileplaying/loading callback frequency. If null, native HTML5 update events are used.
				html5Test: /^(probably|maybe)$/i,   // HTML5 Audio() format support test. Use /^probably$/i; if you want to be more conservative.
				flashLoadTimeout: 1000,	            // msec to wait for flash movie to load before failing (0 = infinity)
				idPrefix: 'sound',	                // if an id is not provided to createSound(), this prefix is used for generated IDs - 'sound0', 'sound1' etc.
				ignoreMobileRestrictions: false,	// if true, SM2 will not apply global HTML5 audio rules to mobile UAs. iOS > 7 and WebViews may allow multiple Audio() instances.
				noSWFCache: false,	                // if true, appends ?ts={date} to break aggressive SWF caching.
				preferFlash: false,	                // overrides useHTML5audio. if true and flash support present, will try to use flash for MP3/MP4 as needed. Useful if HTML5 audio support is quirky.
				useConsole: true,	                // use console.log() if available (otherwise, writes to #soundmanager-debug element)
				useFlashBlock: false,	            // requires flashblock.css, see demos - allow recovery from flash blockers. Wait indefinitely and apply timeout CSS to SWF, if applicable.
				useHighPerformance: false,	        // position:fixed flash movie can help increase js/flash speed, minimize lag
				useHTML5Audio: true,	            // use HTML5 Audio() where supported. Some browsers may not support "non-free" MP3/MP4/AAC codecs. Ideally, transparent vs. Flash API where possible.
				waitForWindowLoad: false,	        // force SM2 to wait for window.onload() before trying to call soundManager.onready()
				wmode: null,                        // flash rendering mode - null, 'transparent', or 'opaque' (last two allow z-index)
				debugMode: debugMode,               // enable debugging output (console.log() with HTML fallback)
				debugFlash: false,	                // enable debugging output inside SWF, troubleshoot Flash/browser issues
				onready: function () {
					loadSounds();
				},
				ontimeout: function () {
					console.log('SM2 init failed!');
				},
				defaultOptions: {
					volume: window.volume // set global default volume for all sound objects
				}
			});
		});
	} catch (e) {
		console.log(e);
	}
}

function loadSounds() {
	try {
		whenAvailable('launcher', function () {
			launcher.getFiles(window.soundFolder).then(function (files) {
				if (window.environment !== 'Production') {
					console.log({'loadedSounds': files});
				}
				window.sounds = files;
				$.each(files, function (i, v) {
					soundManager.createSound({
						id: v,
						url: v
					});
				});
			});
		});
	} catch (e) {
		console.log(e);
	}
}

function playSound(filename) {
	try {
		whenAvailable('soundManager', function () {
			soundManager.play(window.soundFolder + '/' + filename);
		});
	} catch (e) {
		console.log(e);
	}
}

function setVolume(newVolume) {
	try {
		window.volume = newVolume;
		whenAvailable('soundManager', function () {
			try {
				soundManager.setVolume(newVolume);
			} catch (e) {
				console.log(e);
			}
		});
	} catch (e) {
		console.log(e);
	}
}
