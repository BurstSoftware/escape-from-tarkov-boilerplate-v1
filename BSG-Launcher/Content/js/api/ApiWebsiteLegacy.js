const WEBSITE_API_LEGACY_ROUTE = 'launcher'

class MainScreenContentLegacy {
	constructor(obj) {
		this.importantNews = ImportantNewsLegacy.readListResponse(obj.importantNews)
		this.pinnedNews = ArticleLegacy.readMainContentResponse(obj.pinnedNews)
		this.carouselList = SlideLegacy.readMainContentResponse(obj.carouselList)
		this.siteConfig = obj.siteConfig
	}

	static fromResponse(response) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response) : null
	}
}

class LegalLegacy {
	constructor(obj) {
		this.title = i18next.t("LegalHeading1")

		this.documents = ''

		if (Array.isArray(obj)) {
			obj.forEach(element => {
				this.documents += this.documentTpl(element)
			})
		} else {
			this.documents += this.documentTpl(obj)
		}

		this.content =
			'<h3>' + i18next.t("LegalHeading2") + '</h3>' +
			this.documents +
			'<h3>' + i18next.t("LegalFooter") + '</h3>'
	}

	static readResponse(response) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response) : null
	}

	documentTpl(document) {
		return '<div class="spoiler" data-document-id="' + document.id + '">' +
			'<h3>' + document.localisation.typeName + '</h3>' +
			'<div class="spoilerContent">' +
			'<p><strong>' + document.localisation.lastUpdate + ' ' + document.localisation.updateDate + '</strong></p>' + document.localisation.text +
			'</div>' +
			'<hr/>' +
			'</div>'
	}
}

class SlideLegacy extends Slide {
	constructor(obj, thumbSize) {
		super(obj, thumbSize)
		if (!['link', 'youtube'].includes(obj.type)) {
			switch (parseInt(obj.type)) {
				case 4:
					obj.type = 'link'
					break
				case 2:
					obj.type = 'youtube'
					break
				default:
					obj.type = ''
					break
			}
		}
		this.id = obj.id
		this.title = obj.header
		this.image = ApiWebsite.getSiteImageValue(obj, thumbSize)
		this.provider = obj.type
		this.providerData = obj.link
		this.createdMoment = moment(new Date(parseInt(obj.date) * 1000))
	}

	static readMainContentResponse(response) {
		if(IsJsonString(response)) {
			response = JSON.parse(response)
		}
		return typeof response === 'object' ? response : null
	}

	static readListResponse(response) {
		if(IsJsonString(response)) {
			response = JSON.parse(response)
		}
		return typeof response.data === 'object' ? response.data : null
	}
}

class ArticleLegacy extends Article {
	constructor(obj, thumbSize) {
		super(obj, thumbSize)
		this.slug = obj.id
		this.title = obj.header
		this.excerpt = obj.small_descr
		this.content = obj.descr || null
		this.image = ApiWebsite.getSiteImageValue(obj, thumbSize)
		this.likesCount = obj.likes
		this.createdMoment = moment(new Date(parseInt(obj.date) * 1000))
	}

	static readMainContentResponse(response) {
		if(IsJsonString(response)) {
			response = JSON.parse(response)
		}
		return {
			items: typeof response === 'object' ? response : null,
			totalItems: typeof response?.count === 'number' ? response.count : 0,
		}
	}

	static readListResponse(response) {
		if(IsJsonString(response)) {
			response = JSON.parse(response)
		}
		return {
			items: typeof response?.data === 'object' ? response.data : null,
			totalItems: typeof response?.count === 'number' ? response.count : 0,
		}
	}

	static readViewResponse(response, thumbSize) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response, thumbSize) : null
	}

	getRoute() {
		return '/news/id/'+this.slug
	}
}

class ImportantNewsLegacy extends ImportantNews {
	constructor(obj) {
		super(obj)
		this.id = obj.id
		this.disableBugreports = obj.disableBugreports
		this.message = obj.message
		this.url = obj.url
		this.createdMoment = moment(new Date(parseInt(obj.datecreated) * 1000))
	}
}

class SupportConfigLegacy extends SupportConfig {
	constructor(obj) {
		super(obj)
		this.categories = []
		this.gameLogsSizeLimit = obj.gameLogsSizeLimit || 1000000
		this.gameLogsFreshnessSec = obj.gameLogsFreshnessSec || 864000
		this.postMaxSize = obj.postMaxSize || 15000000
		this.maxFileSize = obj.maxFileSize || 15000000
		this.warning = obj.warning || null
		this.menu = obj.menu || null

		if(typeof obj.categories === 'object') {
			obj.categories.forEach((category)=>{
				let catId = parseInt(category['category_id'])
				if(catId) {
					category.id = catId || null
					delete category['category_id']
					this.categories.push(category)
				}
			})
		}
	}

	static readConfigResponse(response) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response) : null
	}
}

class FeedbackLegacy {
	constructor(obj) {
		this.datecreated = obj.datecreated || -1
		this.questions = obj.data || []

		if (Object.keys(this.questions[0]['localisation'])[0]) {
			window.lang = Object.keys(this.questions[0]['localisation'])[0]
		}
	}

	getText(item) {
		return item['localisation'][window.lang]
	}

	getValues(question) {
		return question.values
	}

	static readResponse(response) {
		return typeof response === 'object' ? new this(response) : null
	}
}

/**
	Methods must have same names and args in all endpoints
 */
const ApiWebsiteLegacy = {
	mainScreenContentModel() {
		return MainScreenContentLegacy
	},

	legalModel() {
		return LegalLegacy
	},

	slideModel() {
		return SlideLegacy
	},

	articleModel() {
		return ArticleLegacy
	},

	importantNewsModel() {
		return ImportantNewsLegacy
	},

	supportConfigModel() {
		return SupportConfigLegacy
	},

	supportKnowledgeModel() {
		return SupportKnowledge
	},

	feedback() {
		return FeedbackLegacy
	},

	async getContent(branchName, langCode, callback) {
		return this.get('/content/'+branchName + '/' + langCode, null, callback)
	},

	async getConfig(callback) {
		return this.get('/site/config', null, callback)
	},

	/** payload = {document: document, language: lang} */
	async getLegal(payload, callback, onError) {
		if (payload && typeof payload.document === 'string' && payload.document.length) {
			payload.lang = payload.language
			return this.post('/user/legal/get', payload, callback, onError)
		}
		return this.post('/user/legal', payload, callback, onError)
	},

	/** payload = {legals: legals}, legals is array of ids */
	async acceptLegal(payload, callback, errorCb) {
		return this.post('/user/legal/accept', payload, callback, errorCb)
	},

	async getSlides(lang, callback) {
		return this.get('/media/' + (lang || 'en'), null, callback)
	},

	async getPinnedNews(lang, callback) {
		return this.get('/news/' + (lang || 'en') + '/pinned', null, callback)
	},

	async listNews(lang, page, successCallback, errorCallback) {
		return this.get('/news/' + (lang || 'en') + '/page/' + page, null, successCallback, errorCallback)
	},

	async viewNews(lang, id, callback) {
		return this.get('/news/' + (lang || 'en') + '/id/' + id, null, callback)
	},

	async likeNews(id, successCallback, errorCallback) {
		return this.get('/news/like/' + id, null, successCallback, errorCallback)
	},

	async getImportantNews(lang, callback) {
		return this.get('/support/news/' + (lang || 'en'), null, callback)
	},

	async getSupportConfig(lang, callback) {
		return this.post('/support/configuration', {lang: lang}, callback)
	},

	async getSupportKnowledge(id, callback, errorCb) {
		return this.get('/support/knowledge/'+id, null, callback, errorCb)
	},

	async getEtsInfo(lang, callback) {
		return this.get('/ets/info/' + lang, null, callback)
	},

	async signUpEts(callback, errorCb) {
		return this.get('/ets/signup', null, callback, errorCb)
	},

	async saveFeedback(payload, callback, errorCb) {
		return this.post('/user/feedback/set', payload, callback, errorCb)
	},

	async get(route, payload, successCallback, errorCallback) {
		return this.request('GET', route, payload, successCallback, errorCallback)
	},

	async post(route, payload, successCallback, errorCallback) {
		return this.request('POST', route, payload, successCallback, errorCallback)
	},

	async request(method, route, payload, successCallback, errorCallback) {
		try {
			let successCb = successCallback || null,
				errorCb = errorCallback || null

			if (window.environment !== 'Production') {
				console.log(['Begin Site Api Legacy request ' + WEBSITE_API_LEGACY_ROUTE + route, JSON.stringify(payload), successCb, errorCb])
			}

			if (typeof payload !== 'string' && payload) {
				payload = JSON.stringify(payload)
			}

			return await launcher.requestSite(method, WEBSITE_API_LEGACY_ROUTE + route, payload, successCb, errorCb)
		} catch (e) {
			console.error(e)
		}
		return null
	}

}
