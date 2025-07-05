const WEBSITE_API_V1_ROUTE = '/api/launcher/v1'

class MainScreenContent {
	constructor(obj) {
		this.importantNews = ImportantNews.readListResponse(obj.importantNews)
		this.pinnedNews = Article.readListResponse(obj.pinnedNews)
		this.carouselList = Slide.readListResponse(obj.carouselList)
		this.siteConfig = obj.siteConfig
	}

	static fromResponse(response) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response) : null
	}
}

class Legal {
	constructor(obj) {
		this.title = i18next.t("LegalHeading1")

		this.documents = ''
		if (typeof obj.required === 'object' && obj.required.length) {
			obj.required.forEach(element => {
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
		return '<div class="spoiler" data-document-id="' + document.document.id + '">' +
			'<h3>' + document.name + '</h3>' +
			'<div class="spoilerContent">' +
			'<p><strong>' + moment(document.document.date).format('DD MMMM, YYYY') + '</strong></p>' + document.document.text +
			'</div>' +
			'<hr/>' +
			'</div>'
	}
}

class Slide {
	constructor(obj, thumbSize) {
		this.id = obj.id
		this.title = obj.title
		this.image = ApiWebsite.getSiteImageValue(obj, thumbSize)
		this.provider = obj.provider
		this.providerData = obj.providerData
		this.createdMoment = moment(obj.createdAt)
	}

	static readListResponse(response) {
		if(IsJsonString(response)) {
			response = JSON.parse(response)
		}
		return typeof response?.items === 'object' ? response.items : null
	}
}

class Article {
	constructor(obj, thumbSize) {
		this.slug = obj.slug
		this.title = obj.title
		this.excerpt = obj.excerpt
		this.content = obj.content || null
		this.image = ApiWebsite.getSiteImageValue(obj, thumbSize)
		this.likesCount = obj.likesCount
		this.createdMoment = moment(obj.publishedAt)
		this.onClick = obj.onClick || null
	}

	static readListResponse(response) {
		if(!response) {
			return {items: [], totalItems: 0}
		}
		if(IsJsonString(response)) {
			response = JSON.parse(response)
		}
		return {
			items: typeof response?.items === 'object' ? response.items : null,
			totalItems: typeof response?.totalItems === 'number' ? response.totalItems : 0,
		}
	}

	static readViewResponse(response, thumbSize) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response, thumbSize) : null
	}

	static readLikeResponse(response) {
		response = JSON.parse(response)
		return typeof response === 'object' ? response : null
	}

	getRoute() {
		return '/news/'+this.slug
	}
}

class ImportantNews {
	constructor(obj) {
		this.id = obj.id
		this.disableBugreports = obj.disableBugreports
		this.message = obj.message
		this.url = obj.url
		this.variant = obj.variant ?? 'danger'
		this.createdMoment = moment(obj.createdAt)
	}

	static readListResponse(response) {
		if (!response) {
			return []
		}
		return typeof response === 'object' ? response : []
	}
}

class SupportConfig {
	constructor(obj) {
		this.categories = obj.categories || obj.categories || []
		this.gameLogsSizeLimit = obj.gameLogsSizeLimit || 1000000
		this.gameLogsFreshnessSec = obj.gameLogsFreshnessSec || 864000
		this.postMaxSize = obj.postMaxSize || 15000000
		this.maxFileSize = obj.maxFileSize || 15000000
		this.warning = obj.warning || null
		this.menu = obj.menu || null

		this.categories = this.categories.filter(function (obj) {
			return obj.id !== 0
		})
	}

	static readConfigResponse(response) {
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response) : null
	}
}

class SupportKnowledge {
	constructor(obj) {
		this.subject = obj?.subject || ''
		this.text = obj?.text || ''
		this.link = obj?.link || '#'
	}

	static readResponse(response) {
		if(!response) {
			return null
		}
		response = JSON.parse(response)
		return typeof response === 'object' ? new this(response) : null
	}
}

class Feedback {
	constructor(obj) {
		this.datecreated = obj.datecreated || -1
		this.questions = []
		this.userAnswers = obj.data.userAnswers

		obj.data.questions.forEach((question) => {
			question.values = []
			this.questions.push(question)
		})
	}

	getText(item) {
		return item.text
	}

	getValues(question) {
		let userAnswers = this.userAnswers.filter((userAnswer) => userAnswer.question.id === question.id)
		return userAnswers.map((userAnswer) => {
			return {answer: userAnswer.text, aid: userAnswer.answer ? userAnswer.answer.id : null}
		})
	}

	static readResponse(response) {
		return typeof response === 'object' ? new this(response) : null
	}
}

/**
 * Methods must have same names and args in all endpoints
 */
const ApiWebsiteV1 = {
	mainScreenContentModel() {
		return MainScreenContent
	},

	legalModel() {
		return Legal
	},

	slideModel() {
		return Slide
	},

	articleModel() {
		return Article
	},

	importantNewsModel() {
		return ImportantNews
	},

	supportConfigModel() {
		return SupportConfig
	},

	supportKnowledgeModel() {
		return SupportKnowledge
	},

	feedback() {
		return Feedback
	},

	async getContent(branchName, langCode, callback) {
		return this.get('/content/' + branchName + '/' + langCode, null, callback)
	},

	async getConfig(callback) {
		return this.get('/config', null, callback)
	},

	/** payload = {slug: slug} */
	async getLegal(payload, callback, onError) {
		if (payload && typeof payload.document === 'string' && payload.document.length) {
			return this.get('/legal/' + payload.document, null, callback, onError)
		}
		return this.get('/legal', null, callback, onError)
	},

	/** payload = {legals: legals}, legals is array of ids */
	async acceptLegal(payload, callback, errorCb) {
		return this.post('/legal/accept', payload, callback, errorCb)
	},

	async getSlides(lang, callback) {
		return this.get('/slides', null, callback)
	},

	async getPinnedNews(lang, callback) {
		return this.get('/news/pinned', null, callback)
	},

	async listNews(lang, page, successCallback, errorCallback) {
		return this.get('/news?page=' + parseInt(page), null, successCallback, errorCallback)
	},

	async viewNews(lang, slug, callback) {
		return this.get('/news/' + encodeURIComponent(slug), null, callback)
	},

	async likeNews(slug, successCallback, errorCallback) {
		return this.get('/news/' + encodeURIComponent(slug) + '/like', null, successCallback, errorCallback)
	},

	async getImportantNews(lang, callback) {
		return this.get('/support/news', null, callback)
	},

	async getSupportConfig(lang, callback) {
		return this.get('/support/config', null, callback)
	},

	async getSupportKnowledge(id, callback, errorCb) {
		return this.get('/support/knowledge/'+id, null, callback, errorCb)
	},

	async getEtsInfo(lang, callback) {
		return this.get('/ets', null, callback)
	},

	async signUpEts(callback, errorCb) {
		return this.post('/ets/signup', null, callback, errorCb)
	},

	async saveFeedback(formData, callback, errorCb) {
		let payload = prepareFeedbackPayload(formData)
		return this.post('/feedback', payload, callback, errorCb)
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
				console.log(['Begin Site Api V1 request ' + WEBSITE_API_V1_ROUTE + route, JSON.stringify(payload), successCb, errorCb])
			}

			if (typeof payload !== 'string' && payload) {
				payload = JSON.stringify(payload)
			}

			return await launcher.requestSite(method, WEBSITE_API_V1_ROUTE + route, payload, successCb, errorCb)
		} catch (e) {
			console.error(e)
		}
		return null
	}

}

function prepareFeedbackPayload(data) {
	let payload = []

	for (const [key, question] of Object.entries(window.CurrentFeedback.questions)) {
		let value = data['question_' + question.id] || null
		if (value) {
			let userAnswer = window.CurrentFeedback.userAnswers.find((userAnswer) => userAnswer.question.id === question.id)
			if (window.feedbackAnswersRequiredTypes.includes(question.fieldType)) {
				if (Array.isArray(value)) {
					value.forEach((val) => {
						if (val) {
							payload.push({
								id: null,
								answer: val,
								question: question.id,
								text: null
							})
						}
					})
				} else {
					payload.push({
						id: userAnswer && userAnswer.id ? userAnswer.id : null,
						answer: value,
						question: question.id,
						text: null
					})
				}
			} else {
				payload.push({
					id: userAnswer && userAnswer.id ? userAnswer.id : null,
					answer: null,
					question: question.id,
					text: value
				})
			}

		}

	}

	return {userAnswers: payload}
}
