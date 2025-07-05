function reloadSettings() {
	try {
		if(typeof launcher.reloadSettings === 'function') {
			launcher.reloadSettings();
		}
	} catch(e) {
		console.log(e);
	}
}

function checkConsistency(button) {
	try{
		if(!$(button).hasClass('disabled')) {
			launcher.checkConsistency(true);
		} else {
			console.log('Checking game consistency is disabled for now.');
		}
	} catch(e) {
		console.log(e);
	}
}
function clearCache(button) {
	try{
		if(!$(button).hasClass('disabled')) {
			launcher.clearCache();
		} else {
			console.log('Cleaning cache is disabled for now.');
		}
	} catch(e) {
		console.log(e);
	}
}
function showDir(folder, button) {
	try{
		if(!$(button).hasClass('disabled')) {
			launcher.showDir(folder);
		} else {
			console.log('Show directory is disabled for now.');
		}
	} catch(e) {
		console.log(e);
	}
}
function startGame() {
	try{
		launcher.startGame();
	} catch(e) {
		console.log(e);
	}
}
async function startDrag() {
	if(!window.w_maximize.hasClass('maximized') && !window.windowIsDragging) {
		console.log('windowIsDragging = true');
		window.windowIsDragging = true;
		try {
			await launcher.dragMove(function () {
				window.windowIsDragging = false;
				console.log('windowIsDragging = false');
			})
		} catch(e) {
			console.log('windowIsDragging = error');
			window.windowIsDragging = false;
			console.log(e);
		}
	}
}

/** @deprecated */
async function siteRequest(route, params, callback, errorCallback) {
	try {
		var errorCb = errorCallback || null;
		if(window.environment !== 'Production') {
			console.log(['Begin siteRequest ' + route, params]);
		}
		if(typeof params !== 'string') {
			params = JSON.stringify(params);
		}
		await launcher.siteRequest('launcher/' + route, params, callback, errorCb);
	} catch(e) {
		console.log(e);
	}
}

function cancelGameQueue()
{
	try{
		launcher.cancelGameQueue();
	} catch(e) {
		console.log(e);
	}
}

function launcherSetRemember(cb)
{
	try{
		launcher.setRemember(cb.checked);
	} catch(e) {
		console.log(e);
	}
}

function launcherLogin(email, password, captcha)
{
	try {
		launcher.login(email, password, captcha);
	} catch(e) {
		console.log(e);
	}
}

function launcherRegisterUser(email, password, confirmPassword, captcha, privacy, callback)
{
	try {
		launcher.registerUser(email, password, confirmPassword, captcha, privacy, callback)
	} catch(e) {
		console.log(e)
	}
}

function launcherToLoginWindow()
{
	try {
		launcher.toLoginWindow()
	} catch(e) {
		console.log(e)
	}
}

function launcherActivateDevice(email, password, code)
{
	try {
		if(email === null || password === null) {
			launcher.activateDeviceExternalAuth(code)
		} else {
			launcher.activateDevice(email, password, code)
		}
	} catch(e) {
		console.log(e)
	}
}
function launcherVerifyPhone(email, val, callback)
{
	try {
		if(email === null) {
			launcher.verifyPhoneExternalAuth(val, callback)
		} else {
			launcher.verifyPhone(email, val, callback)
		}
	} catch(e) {
		console.log(e)
	}
}
function launcherVerifyCode(email, password, val, callback)
{
	try {
		if(email === null || password === null) {
			launcher.verifyCodeExternalAuth(val, callback)
		} else {
			launcher.verifyCode(email, password, val, callback)
		}
	} catch(e) {
		console.log(e)
	}
}

function launcherClose() {
	try{
		launcher.close()
	} catch(e) {
		console.log(e)
	}
}

function launcherMinimize() {
	try{
		launcher.setWindowState('minimized')
	} catch(e) {
		console.log(e)
	}
}

function launcherMaximize() {
	try{
		launcher.setWindowState('maximized')
	} catch(e) {
		console.log(e)
	}
}

function launcherRestore() {
	try{
		launcher.setWindowState('normal')
	} catch(e) {
		console.log(e)
	}
}

function installGame() {
	try {
		launcher.installGame()
	} catch(e) {
		console.log(e)
	}
}
function repairGame() {
	try {
		launcher.repairGame()
	} catch(e) {
		console.log(e)
	}
}
function updateGame(gameName) {
	try {
		launcher.updateGame(gameName)
	} catch(e) {
		console.log(e)
	}
}
function checkForUpdate(button) {
	try {
		if(!$(button).hasClass('disabled')) {
			launcher.checkForUpdate()
		} else {
			console.log('Checking for game updates is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function pauseInstallation(gameName) {
	try {
		launcher.pauseInstallation(gameName)
	} catch(e) {
		console.log(e)
	}
}

function stopInstallation(gameName) {
	try {
		launcher.stopInstallation(gameName)
	} catch(e) {
		console.log(e)
	}
}

function resumeInstallation(gameName) {
	try {
		launcher.resumeInstallation(gameName)
	} catch(e) {
		console.log(e)
	}
}

function refreshNetworkState() {
	try {
		launcher.refreshNetworkAvailabilityState()
	} catch(e) {
		console.log(e)
	}
}

/**
 * @param code
 * @param args
 * @returns {*}
 * User dialog input will be in returned value
 * 0 Cancelled Результат не выбран
 * 1 Positive Выбран положительный результат (ok, yes, apply)
 * 2 Negative Выбран отрицательный результат (cancel, no, reject)
 */
function showDialog(code, args) {
	try {
		return launcher.showDialog(code, args)
	} catch(e) {
		console.log(e)
	}
}

/**
 * @param code
 * @param args
 * @param callback
 * @returns {Promise<void>}
 * User dialog input will be in callback argument
 * 0 Cancelled Результат не выбран
 * 1 Positive Выбран положительный результат (ok, yes, apply)
 * 2 Negative Выбран отрицательный результат (cancel, no, reject)
 */
async function showDialogAsync(code, args, callback) {
	try {
		let cb = callback || null
		await launcher.showDialogAsync(code, args, cb)
	} catch(e) {
		console.log(e)
	}
}

function showCodeError(errorCode, localisationKey, localisationArgs) {
	try {
		launcher.showCodeError(errorCode, i18next.t(localisationKey, {args: localisationArgs}), localisationArgs)
	} catch(e) {
		console.log(e)
	}
}

async function showCodeErrorAsync(errorCode, localisationKey, localisationArgs) {
	try {
		await launcher.showCodeErrorAsync(errorCode, i18next.t(localisationKey, {args: localisationArgs}), localisationArgs)
	} catch(e) {
		console.log(e)
	}
}

function showBugreport(button) {
	try {
		if(window.bugReportDisabledMessage) {
			showCodeError(302007, 'error_msg_302007', [window.bugReportDisabledMessage])
			return
		}

		if(!$(button).hasClass('disabled')) {
			launcher.showBugreport()
		} else {
			console.log('Sending bug report is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function showFeedback(button) {
	try {
		if(!$(button).hasClass('disabled')) {
			launcher.showFeedbackWindow()
		} else {
			console.log('Leave feedback is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function showCodeActivationWindow(button) {
	try {
		if(!$(button).hasClass('disabled')) {
			launcher.showCodeActivationWindow()
		} else {
			console.log('ShowCodeActivationWindow is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function selectGameFolder(item) {
	try {
		if(!$(item).hasClass('disabled')) {
			launcher.selectGameFolder()
		} else {
			console.log('Change folder is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function selectGameRootDir() {
	try {
		launcher.selectGamesRootDir()
	} catch(e) {
		console.log(e)
	}
}

function selectTempFolder(item) {
	try {
		if(!$(item).hasClass('disabled')) {
			launcher.selectTempFolder()
		} else {
			console.log('Change folder is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function clearTempFolder(item) {
	try {
		if(!$(item).hasClass('disabled')) {
			launcher.clearTempFolder()
		} else {
			console.log('clearTempFolder is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function showMatchingConfig(item) {
	try {
		if(!$(item).hasClass('disabled') && window.siteConfig.isMatchingConfigEnabled) {
			launcher.showMatchingConfig()
		} else {
			console.log('Change folder is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function selectBranch(branchName) {
	try {
		launcher.selectBranch(branchName)
	} catch (e) {
		console.log(e)
	}
}

async function selectGame(gameName, cb) {
	try {
		await launcher.selectGame(gameName, cb)
	} catch (e) {
		console.log(e)
	}
}

function showLicenseAgreementWindow(document) {
	try {
		launcher.showLicenseAgreementWindow(document)
	} catch(e) {
		console.log(e)
	}
}

function goTo(href){
	try {
		launcher.goto(href)
	} catch(e) {
		console.log(e)
	}
}

function navigateToDirectory(dir){
	try {
		launcher.navigateToDirectory(dir)
	} catch(e) {
		console.log(e)
	}
}

function navigateToSelectedGameDir(item){
	try {
		if(!$(item).hasClass('disabled')) {
			launcher.navigateToSelectedGameDir()
		} else {
			console.log('navigateToSelectedGameDir is disabled for now.')
		}
	} catch(e) {
		console.log(e)
	}
}

function launcherDisplayBrowser(){
	if(!window.browserVisible) {
		window.browserVisible = true
		try {
			launcher.displayBrowser()
		} catch(e) {
			console.log(e)
		}
	}
}

function launcherSetWindowSize(width, height) {
	try {
		launcher.setSize(
			Math.round(width),
			Math.round(height)
		)
	} catch(e) {
		console.log(e)
	}
}

function incrementBusyCounter() {
	try {
		launcher.incrementBusyCounter()
	} catch(e) {
		console.log(e)
	}
}

function decrementBusyCounter() {
	try {
		launcher.decrementBusyCounter()
	} catch(e) {
		console.log(e)
	}
}

function resendActivationMail() {
	console.log('resendActivationMail')
}
