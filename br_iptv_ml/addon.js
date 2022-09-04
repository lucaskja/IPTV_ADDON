const { addonBuilder } = require("stremio-addon-sdk")
var request = require('request');

//const countries = {"Brazil": "br", "France":"fr"}

const countries = {'Afghanistan':'af','Albania':'al','Algeria':'dz','Andorra':'ad','Angola':'ao','Argentina':'ar','Armenia':'am','Aruba':'aw','Australia':'au','Austria':'at','Azerbaijan':'az','Bahamas':'bs','Bahrain':'bh','Bangladesh':'bd','Barbados':'bb','Belarus':'by','Belgium':'be','Bolivia':'bo','Bosnia and Herzegovina':'ba','Brazil':'br','Brunei':'bn','Bulgaria':'bg','Burkina Faso':'bf','Cambodia':'kh','Cameroon':'cm','Canada':'ca','Cape Verde':'cv','Chile':'cl','China':'cn','Colombia':'co','Costa Rica':'cr','Croatia':'hr','Curaçao':'cw','Cyprus':'cy','Czech Republic':'cz','Democratic Republic of the Congo':'cd','Denmark':'dk','Dominican Republic':'do','Ecuador':'ec','Egypt':'eg','El Salvador':'sv','Equatorial Guinea':'gq','Estonia':'ee','Ethiopia':'et','Faroe Islands':'fo','Finland':'fi','Fiji':'fj','France':'fr','Gambia':'gm','Georgia':'ge','Germany':'de','Ghana':'gh','Greece':'gr','Grenada':'gd','Guadeloupe':'gp','Guatemala':'gt','Guyana':'gy','Haiti':'ht','Honduras':'hn','Hong Kong':'hk','Hungary':'hu','Iceland':'is','India':'in','Indonesia':'id','Iran':'ir','Iraq':'iq','Ireland':'ie','Israel':'il','Italy':'it','Ivory Coast':'ci','Jamaica':'jm','Japan':'jp','Jordan':'jo','Kazakhstan':'kz','Kenya':'ke','Kosovo':'xk','Kuwait':'kw','Kyrgyzstan':'kg','Laos':'la','Latvia':'lv','Lebanon':'lb','Libya':'ly','Liechtenstein':'li','Lithuania':'lt','Luxembourg':'lu','Macau':'mo','Malaysia':'my','Maldives':'mv','Malta':'mt','Mexico':'mx','Moldova':'md','Mongolia':'mn','Montenegro':'me','Morocco':'ma','Mozambique':'mz','Myanmar':'mm','Nepal':'np','Netherlands':'nl','New Zealand':'nz','Nicaragua':'ni','Nigeria':'ng','North Korea':'kp','North Macedonia':'mk','Norway':'no','Oman':'om','Pakistan':'pk','Palestine':'ps','Panama':'pa','Paraguay':'py','Peru':'pe','Philippines':'ph','Poland':'pl','Portugal':'pt','Puerto Rico':'pr','Qatar':'qa','Republic of the Congo':'cg','Romania':'ro','Russia':'ru','Rwanda':'rw','Saint Kitts and Nevis':'kn','San Marino':'sm','Saudi Arabia':'sa','Senegal':'sn','Serbia':'rs','Sierra Leone':'sl','Singapore':'sg','Sint Maarten':'sx','Slovakia':'sk','Slovenia':'si','Somalia':'so','South Africa':'za','South Korea':'kr','Spain':'es','Sri Lanka':'lk','Sudan':'sd','Sweden':'se','Switzerland':'ch','Syria':'sy','Taiwan':'tw','Tanzania':'tz','Thailand':'th','Togo':'tg','Trinidad and Tobago':'tt','Tunisia':'tn','Turkey':'tr','Turkmenistan':'tm','Uganda':'ug','Ukraine':'ua','United Arab Emirates':'ae','United Kingdom':'uk','United States':'us','Uruguay':'uy','Venezuela':'ve','Vietnam':'vn','Virgin Islands of the United States':'vi','Western Sahara':'eh','Yemen':'ye','Zimbabwe':'zw'}

let urlStream = 'https://iptv-org.github.io/api/streams.json'

let urlGuide = 'https://iptv-org.github.io/api/guides.json'

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
	"id": "community.ml_iptv",
	"version": "0.0.1",
	"catalogs": [
		{
			"type": "tv",
			"id": "top",
			"extra": [
				{ "name": "genre","options": Object.keys(countries), "isRequired": false },
			],
		}
	],
	"resources": [
		"catalog",
		"stream",
		"meta"
	],
	"types": [
		"tv"
	],
	"name": "ml_iptv",
	"description": "Open brazilian channels"
}
let currentStreams = {
	metas: [],
	needToUpdate: -1
}

let currentDataById = {}

const getStreams = () => {
	return new Promise((resolve, reject) => {
		request(urlStream, (error, response, body) => {
			if(error){
				reject(error);
			}else if (!response || response.statusCode!=200 ){
				reject(response.statusCode);
			} else {
				console.log(body)
			}
		})
	})
}

const getData = (country) => {
	return new Promise((resolve, reject) => {
		var url = 'https://iptv-org.github.io/iptv/countries/'+countries[country]+'.m3u';
		request(url, function (error, response, body) {
			if(error){
				reject(error);
			}else if (!response || response.statusCode!=200 ){
				reject(response.statusCode);
			}else if (body){
				currentData[countries[country]] = {}
				currentData[countries[country]].metas = m3uToMeta(body,country)
				// console.log(currentDataById)
				resolve(currentData[countries[country]].metas);
			}
		});
	});
}

const builder = new addonBuilder(manifest)

builder.defineCatalogHandler(({type, id, extra}) => {
	return new Promise((resolve, reject) => {
		resolve(getStreams())
	})
	// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineCatalogHandler.md
})

builder.defineMetaHandler(({type, id, extra}) => {
	console.log("request for meta: "+type+" "+id)
	console.log(extra)
	// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineMetaHandler.md
	if(type == "tv") {
		let metaObj = currentDataById[id]
		metaObj
		return Promise.resolve({meta: metaObj})
	}
	return Promise.resolve({ meta: null })
})

builder.defineStreamHandler(({type, id}) => {
	console.log("request for streams: "+type+" "+id)
	// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineStreamHandler.md
	// return no streams
	return Promise.resolve({ streams: currentDataById[id].streams })
})

module.exports = builder.getInterface()