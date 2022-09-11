const { addonBuilder } = require("stremio-addon-sdk")
var request = require('request');

//const countries = {"Brazil": "br", "France":"fr"}

const countries = {'Afghanistan':'af','Albania':'al','Algeria':'dz','Andorra':'ad','Angola':'ao','Argentina':'ar','Armenia':'am','Aruba':'aw','Australia':'au','Austria':'at','Azerbaijan':'az','Bahamas':'bs','Bahrain':'bh','Bangladesh':'bd','Barbados':'bb','Belarus':'by','Belgium':'be','Bolivia':'bo','Bosnia and Herzegovina':'ba','Brazil':'br','Brunei':'bn','Bulgaria':'bg','Burkina Faso':'bf','Cambodia':'kh','Cameroon':'cm','Canada':'ca','Cape Verde':'cv','Chile':'cl','China':'cn','Colombia':'co','Costa Rica':'cr','Croatia':'hr','Curaçao':'cw','Cyprus':'cy','Czech Republic':'cz','Democratic Republic of the Congo':'cd','Denmark':'dk','Dominican Republic':'do','Ecuador':'ec','Egypt':'eg','El Salvador':'sv','Equatorial Guinea':'gq','Estonia':'ee','Ethiopia':'et','Faroe Islands':'fo','Finland':'fi','Fiji':'fj','France':'fr','Gambia':'gm','Georgia':'ge','Germany':'de','Ghana':'gh','Greece':'gr','Grenada':'gd','Guadeloupe':'gp','Guatemala':'gt','Guyana':'gy','Haiti':'ht','Honduras':'hn','Hong Kong':'hk','Hungary':'hu','Iceland':'is','India':'in','Indonesia':'id','Iran':'ir','Iraq':'iq','Ireland':'ie','Israel':'il','Italy':'it','Ivory Coast':'ci','Jamaica':'jm','Japan':'jp','Jordan':'jo','Kazakhstan':'kz','Kenya':'ke','Kosovo':'xk','Kuwait':'kw','Kyrgyzstan':'kg','Laos':'la','Latvia':'lv','Lebanon':'lb','Libya':'ly','Liechtenstein':'li','Lithuania':'lt','Luxembourg':'lu','Macau':'mo','Malaysia':'my','Maldives':'mv','Malta':'mt','Mexico':'mx','Moldova':'md','Mongolia':'mn','Montenegro':'me','Morocco':'ma','Mozambique':'mz','Myanmar':'mm','Nepal':'np','Netherlands':'nl','New Zealand':'nz','Nicaragua':'ni','Nigeria':'ng','North Korea':'kp','North Macedonia':'mk','Norway':'no','Oman':'om','Pakistan':'pk','Palestine':'ps','Panama':'pa','Paraguay':'py','Peru':'pe','Philippines':'ph','Poland':'pl','Portugal':'pt','Puerto Rico':'pr','Qatar':'qa','Republic of the Congo':'cg','Romania':'ro','Russia':'ru','Rwanda':'rw','Saint Kitts and Nevis':'kn','San Marino':'sm','Saudi Arabia':'sa','Senegal':'sn','Serbia':'rs','Sierra Leone':'sl','Singapore':'sg','Sint Maarten':'sx','Slovakia':'sk','Slovenia':'si','Somalia':'so','South Africa':'za','South Korea':'kr','Spain':'es','Sri Lanka':'lk','Sudan':'sd','Sweden':'se','Switzerland':'ch','Syria':'sy','Taiwan':'tw','Tanzania':'tz','Thailand':'th','Togo':'tg','Trinidad and Tobago':'tt','Tunisia':'tn','Turkey':'tr','Turkmenistan':'tm','Uganda':'ug','Ukraine':'ua','United Arab Emirates':'ae','United Kingdom':'uk','United States':'us','Uruguay':'uy','Venezuela':'ve','Vietnam':'vn','Virgin Islands of the United States':'vi','Western Sahara':'eh','Yemen':'ye','Zimbabwe':'zw'}

let urlStream = 'https://iptv-org.github.io/api/streams.json'

let urlGuide = 'https://iptv-org.github.io/api/guides.json'

let urlCategories = 'https://iptv-org.github.io/api/categories.json'

let categories = ['auto', 'animation', 'business', 'classic', 'comedy', 'cooking', 'culture', 'documentary', 'education', 'entertainment', 'family', 'general', 'kids', 'legislative', 'lifestyle', 'movies', 'music', 'news', 'outdoor', 'relax', 'religious', 'series', 'science', 'shop', 'sports', 'travel', 'weather', 'xxx']

const getUrl = cat => 'https://iptv-org.github.io/iptv/categories/'+cat+'.m3u'

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
	"id": "community.ml_iptv",
	"version": "0.0.1",
	"catalogs": [
		{
			"type": "tv",
			"id": "top",
			"extra": [
				{ "name": "genre","options": categories, "isRequired": false },
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

let metasByCat = {}
let streamByID = {}
let metaByID = {} 

function match(r,s,i){
	var m = s.match(r);
	return (m && m.length>i)?m[i]:''
}
function updateDataFromM3U(data,cat){
	var channels = data.split('#');
	for (let i = 1; i < channels.length; i++) {
		const item = channels[i];
		var name = match(/,([^\n]+)/,item,1).trim();
		if(!name) continue;
		var img = match(/tvg-logo="([^"]+)"/,item,1);
		var stream = match(/\n(http[^\n]+)/,item,1).trim();
		var id ='iptvorg:'+cat+'::'+name;
		let metaObj = {
			id,
			name,
			poster: img,
			posterShape: 'square',
			type: 'tv'
		}
		if(metasByCat[cat] == undefined) {
			metasByCat[cat] = {
				metas: []
			}
		}
		metasByCat[cat].metas.push(metaObj)
		metaByID[id] = metaObj
		streamByID[id] = {
			title: name,
			url: stream
		}
	}
}

const getStreams = (cat) => {
	return new Promise((resolve, reject) => {
		console.log(getUrl(cat))
		request(getUrl(cat), (error, response, body) => {
			if(error){
				reject(error);
			}else if (!response || response.statusCode!=200 ){
				reject(response.statusCode);
			} else {
				updateDataFromM3U(body, cat)
				resolve(metasByCat[cat])
			}
		})
	})
}


const builder = new addonBuilder(manifest)

builder.defineCatalogHandler(({extra}) => {
	let cat = extra.genre
	return new Promise((resolve, reject) => {
		if (metasByCat[cat] != undefined ) {
			resolve(metasByCat[cat])
		} else {
			getStreams(cat).then(values => {
				resolve(metasByCat[cat])
			})
		}
	})
	// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/requests/defineCatalogHandler.md
})

builder.defineMetaHandler(({type, id}) => {
	console.log(id)
	return Promise.resolve({meta: metaByID[id]})

})

builder.defineStreamHandler(({type, id}) => {
	console.log(type)
	console.log(id)
    if (type === 'tv') {
        // serve one stream for big buck bunny
        return Promise.resolve({ streams: [streamByID[id]] })
    } else {
        // otherwise return no streams
        return Promise.resolve({ streams: [] })
    }
})

module.exports = builder.getInterface()