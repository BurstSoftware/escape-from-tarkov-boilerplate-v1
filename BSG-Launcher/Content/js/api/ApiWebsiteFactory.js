const ApiWebsite = {
	endpoint() {
		switch (window.settings.selectedGame) {
			case 'eft':
				return ApiWebsiteLegacy
			default:
				return ApiWebsiteV1
		}
	},

	/** Data Models */
	mainScreenContentModel() {
		return this.endpoint().mainScreenContentModel()
	},

	legalModel() {
		return this.endpoint().legalModel()
	},

	slideModel() {
		return this.endpoint().slideModel()
	},

	articleModel() {
		return this.endpoint().articleModel()
	},

	importantNewsModel() {
		return this.endpoint().importantNewsModel()
	},

	supportConfigModel() {
		return this.endpoint().supportConfigModel()
	},

	supportKnowledgeModel() {
		return this.endpoint().supportKnowledgeModel()
	},

	feedback() {
		return this.endpoint().feedback()
	},
	/** EoF Data Models */

	/** API Map */
	async getContent(branchName, langCode, callback) {
		return this.endpoint().getContent(branchName, langCode, callback)
	},

	async getConfig(callback) {
		return this.endpoint().getConfig(callback)
	},

	async getLegal(payload, callback, onError) {
		return this.endpoint().getLegal(payload, callback, onError)
	},

	async acceptLegal(payload, callback, errorCb) {
		return this.endpoint().acceptLegal(payload, callback, errorCb)
	},

	async getSlides(lang, callback) {
		return this.endpoint().getSlides(lang, callback)
	},

	async getPinnedNews(lang, callback) {
		return this.endpoint().getPinnedNews(lang, callback)
	},

	async listNews(lang, page, successCallback, errorCallback) {
		return this.endpoint().listNews(lang, page, successCallback, errorCallback)
	},

	async viewNews(lang, id, callback) {
		return this.endpoint().viewNews(lang, id, callback)
	},

	async likeNews(id, successCallback, errorCallback) {
		return this.endpoint().likeNews(id, successCallback, errorCallback)
	},

	async getImportantNews(lang, callback) {
		return this.endpoint().getImportantNews(lang, callback)
	},

	async getSupportConfig(lang, callback) {
		return this.endpoint().getSupportConfig(lang, callback)
	},

	async getSupportKnowledge(id, callback, errorCb) {
		return this.endpoint().getSupportKnowledge(id, callback, errorCb)
	},

	async getEtsInfo(lang, callback) {
		return this.endpoint().getEtsInfo(lang, callback)
	},

	async signUpEts(callback, errorCb) {
		return this.endpoint().signUpEts(callback, errorCb)
	},

	async saveFeedback(payload, callback, errorCb) {
		return this.endpoint().saveFeedback(payload, callback, errorCb)
	},
	/** EoF API Map */

	/** Helper functions */
	getSiteImageValue(objectFromApi, thumbSize) {
		if(objectFromApi?.image) {
			return objectFromApi?.image
		}
		/** From Website API V1 */
		if (objectFromApi.hasOwnProperty('imageFilename')) {
			return this.siteImageUrl(objectFromApi.imageFilename, thumbSize)
		}
		/** From Website API Legacy */
		return thumbSize === 'launcher-thumb' && objectFromApi.hasOwnProperty('ico_big')
			? objectFromApi['ico_big']
			: objectFromApi['ico']
	},

	siteImageUrl(filename, thumb) {
		return getCurrentSiteUrl() + '/uploads/images/' + thumb + '/' + filename
	},
	/** EoF Helper functions */

}
