function renderSiteConfig() {
	window.main_menu_links = {...window.main_menu_template}
	if(typeof window?.siteConfig?.headerLinks !== 'undefined') {
		$.each(window.siteConfig.headerLinks, function (k, v) {
			if(typeof v !== 'undefined') {
				if(k === 'rating' && v) {
					v += '?utm_source=launcher&utm_medium=link_rating&utm_campaign=menu'
				}
				window.main_menu_links[k] = v
			}
		})
	}
	initAcLinks()
	initSiteLinks()
	refreshMatchingConfig()
	renderSidebarGameLabels()
}

function showSettingsPage() {
	let contentBlock = $('#settings_content')

	if (!$.trim(contentBlock.html()).length) {
		$.get('settings.html', function (data) {
			contentBlock.html(data).promise().then(function () {
				$.each(window.langs, function(code, title) {
					$('#language')
						.append($("<option></option>")
							.attr("value",code)
							.text(title));
				});
				$("select").select2(window.s2opt);
				try {
					launcher.getSettings().then(function (data) {
						data = $.parseJSON(data);
						for (var i in data) {
							var val = data[i],
								input = $('#' + i);
							switch (input.attr('type')) {
								case 'checkbox':
									if (true == val) {
										input.attr('checked', 'checked');
									} else {
										input.removeAttr('checked');
									}
									break;
								case 'select':
									input.val(val).select2(window.s2opt);
									break;
								default:
									input.val(val);
									break;
							}
						}
						if(typeof onSettingsUpdated === 'function') {
							onSettingsUpdated(data);
						}
					}).then(function () {
						if (document.getElementById('launchOnStartup').checked) {
							$('#launchMinimized').removeAttr('disabled');
						} else {
							$('#launchMinimized').attr('disabled', 'disabled');
						}
						if (document.getElementById('saveLogin').checked) {
							$('#keepLoggedIn').removeAttr('disabled');
						} else {
							$('#keepLoggedIn').attr('disabled', 'disabled');
						}

						$('#maxDownloadSpeed').keyup();
						$('#settings_content').removeClass('hidden');

						refreshSelectFolder();

						try {
							whenJqueryFuncAvailable('localize',  function() {
								$('#settings').localize();
								$("select").select2(window.s2opt);
								$('input[type="range"]').ionRangeSlider(window.ionSliderDefaultConfig);
							});
						} catch (e) {
							console.log(e);
						}
					});
				} catch (e) {
					console.log(e);
				}
				refreshBranchSelectorState();
			});
			contentBlock.stop(true,false).fadeIn(window.fadeInSpeed)
		});
	} else {
		contentBlock.stop(true,false).fadeIn(window.fadeInSpeed)
	}
}
