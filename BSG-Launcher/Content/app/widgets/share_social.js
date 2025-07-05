
/*SOCIAL SHARER*/
function getShareList(url, title, img, text) {
	let list = '';
	if(window.settings.account.geoInfo.country !== 'RU') {
		list += '<li><a href="'+Share.facebook(url, title, img, text)+'" data-i18n="FB"></a></li>';
	}
	list += '<li><a href="'+Share.twitter(url, title)+'" data-i18n="TW"></a></li>';
	list += '<li><a href="'+Share.vkontakte(url, title, img, text)+'" data-i18n="VK"></a></li>';
	list += '<li><a href="'+Share.odnoklassniki(url, title, img, text)+'" data-i18n="OK"></a></li>';
	list += '<li><a href="'+Share.mailru(url, title, img, text)+'" data-i18n="MR"></a></li>';
	return list;
}


Share = {
	vkontakte: function(purl, ptitle, pimg, text) {
		url  = 'https://vkontakte.ru/share.php?';
		url += 'url='          + encodeURIComponent(purl);
		url += '&title='       + encodeURIComponent(ptitle);
		url += '&description=' + encodeURIComponent(text);
		url += '&image='       + encodeURIComponent(pimg);
		url += '&noparse=true';
		return url;
	},
	odnoklassniki: function(purl, ptitle, pimg, text) {
		url  = 'https://connect.ok.ru/offer?';
		url += 'url='           + encodeURIComponent(purl);
		url += '&title='        + encodeURIComponent(ptitle);
		url += '&description='  + encodeURIComponent(text);
		url += '&imageUrl='     + encodeURIComponent(pimg);
		return url;
	},
	facebook: function(purl, ptitle, pimg, text) {
		url  = 'https://www.facebook.com/sharer.php?s=100';
		url += '&p[title]='     + encodeURIComponent(ptitle);
		url += '&p[summary]='   + encodeURIComponent(text);
		url += '&p[url]='       + encodeURIComponent(purl);
		url += '&p[images][0]=' + encodeURIComponent(pimg);
		return url;
	},
	twitter: function(purl, ptitle) {
		url  = 'https://twitter.com/share?';
		url += 'text='      + encodeURIComponent(ptitle);
		url += '&url='      + encodeURIComponent(purl);
		url += '&counturl=' + encodeURIComponent(purl);
		return url;
	},
	mailru: function(purl, ptitle, pimg, text) {
		url  = 'https://connect.mail.ru/share?';
		url += 'url='          + encodeURIComponent(purl);
		url += '&title='       + encodeURIComponent(ptitle);
		url += '&description=' + encodeURIComponent(text);
		url += '&imageurl='    + encodeURIComponent(pimg);
		return url;
	}
};
/*EOF SOCIAL SHARER*/
