(function(global) {
	'use strict';
	if (window.top != window)
		return;

	var console = (function() {
		var t = [],
			c = {};
		c.log = localStorage.getItem('debugAP') !== null ? function(text) {
			t.push(text);
			window.console.error(text);
		} : function(text) {
			t.push(text);
		};
		c.afficher = function() {
			var i, l;
			for (i = 0, l = t.length; i < l; ++i)
				window.console.log(t[i]);
		};
		c.vider = function() {
			t.length = 0;
		};
		c.detruire = function() {
			t = [];
		};
		c.get = function() {
			return t;
		};
		return c;
	})();
	var V = {
		curDiv: '',
		ancreSud: '',
		lien: '',
		titre: '',
		numPage: 2,
		pageEnChargement: false,
		positionFin: '',
		resteAcharger: 0,
		nbParDefaut: 3,
		error: [],
		groupeDeRegles: 0,
		ancre: +document.URL.split('#autopager_')[1] | 0,
	};
	var NS = global.NS_AutoPager = {};
	NS.addCSS = function(CSS, id) {
		if (!CSS)
			return false;
		var stylesheet = document.createElement('style');
		stylesheet.type = 'text/css';
		id && (stylesheet.id = id);
		stylesheet.innerHTML = CSS;
		document.head.appendChild(stylesheet);
		return stylesheet;
	};
	NS.console = console;
	NS.css = '' +
		'.autopager{text-decoration:blink;background-color:#E6E6E6;text-align:center;margin:0px 0px;color:#03638B;padding:5px 0px;border:solid #C2C2C2 1px;}' +
		'.autopager span{line-height:20px;display:block;width:100%;margin-bottom:5px;}' +
		'.autopager a{text-decoration:blink;color:#03638B;margin:0px 6px;}' +
		'.autopager span a img{border:none;height:18px;float:none;display:inline;vertical-align:text-top;}' +
		'.autopager span button{width:auto;min-width:29px;padding:2px 7px;height:28px;vertical-align:middle;margin:0px 6px;}' +
		'.autopager span input.nbPagesInput{margin:0px 6px 0px 0px;width:60px;min-height:26px;height:26px;border-radius:0px;-webkit-border-radius:0px;padding:0px;font-size:1.3em;text-align:center;vertical-align:middle;border:1px;display:inline-block}' +
		'.autopager h4{text-decoration:blink;margin:5px 0px 0px;color:#03638B;display:inline;line-height:20px;}' +
		'.autopagercache{padding:0px 0px;height:0px;overflow:hidden;}' +
		'.autopagererror{color:red;display:inline-block;}' +
		'.autopagernewchance{color:blue;vertical-align:super;margin-left:20px;}';
	NS.defaultLoad = function(nbPages) {
		nbPages = Number(nbPages) | 0;
		if (nbPages <= 0) {
			console.log('Le nombre de pages doit être un nombre positif non nul.');
			return false;
		}

		V.nbParDefaut = nbPages;
		var inputs = document.querySelectorAll('div.autopager input');
		for (var i = 0, len = inputs.length; i < len; ++i)
			inputs[i].value = nbPages;
		return nbPages;
	};
	NS.evt = function(e) {
		if (e.type === 'click' && e.srcElement.className === 'onOff')
			return NS.scroll.change();

		var input;
		if (e.type === 'click' && e.srcElement.className === 'load')
			input = e.srcElement.parentNode.querySelector('input');
		else if (e.type === 'keydown' && e.srcElement.className === 'nbPagesInput' && e.keyCode === 13)
			input = e.srcElement;
		else return;

		var x = NS.defaultLoad(input.value);
		if (x === false)
			input.value = 3;
		else {
			NS.load(x);
			input.blur();
		}
	};
	NS.finirDiv = function(div, scroll, numPage, titre, undefined) {
		div = div || V.curDiv;
		scroll = scroll || NS.scroll.isOn();
		numPage = (numPage === undefined) ? V.numPage : numPage;
		titre = (titre === undefined) ? V.titre : titre || '';

		var html = '<span>' + (
				numPage ?
				'Page(\u00a0<a href="' + V.lien + '">' + numPage + '</a>\u00a0).\u00a0' :
				'\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'
			) +
			'<a href="javascript:window.scroll(0,0)"title="Aller en haut de la fenêtre.">\
					<img src="data:image/png;base64,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"alt="Aller en haut de la fenêtre.">\
				</a>\
				<a href="#autopager_' + (numPage - 1) + '"title="Page haut.">\
					<img src="data:image/png;base64,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"alt="Page haut.">\
				</a>\
				<a href="#autopager_' + (numPage + 1) + '"title="Page bas.">\
					<img src="data:image/png;base64,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"alt="Page bas.">\
				</a>\
				<a href="javascript:window.scroll(0,document.documentElement.scrollHeight)"title="Aller en bas de la fenêtre.">\
					<img src="data:image/png;base64,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"alt="Aller en bas de la fenêtre.">\
				</a>\
				<button class="load" title="Charger immediatement.">\
					Charger\
				</button>\
				<input type="Number" class="nbPagesInput" min="1" value="' + V.nbParDefaut + '">\
				Pages.\
				<button title="' + (scroll ? 'Désa' : 'A') + 'ctiver le chargement automatique." class="onOff">' + (scroll ? 'O' : 'I') +
			'</button>\
			</span>\
			<a href="#autopager_' + numPage + '">\
				<h4></h4>\
			</a>';
		div.innerHTML = html.split('\t').join('');

		/* Le titre de la page peut contenir des balises qui seraient mal interpretee par innerHTML.*/
		if (titre)
			div.lastElementChild.firstElementChild.innerText = titre;

		if (div === V.curDiv) /*si on est en train de finir un ajout de page.*/
			NS.scroll.addPage(V.curDiv);
	};
	NS.fram = document.createElement('iframe');
	NS.getContent = function(doc, xpath) {
		xpath = xpath || NS.xpath.contenu;
		var contenu = NS.getXpath(xpath, doc);
		return contenu;
	};
	NS.getLink = function(doc, xpath) {
		xpath = xpath || NS.xpath.lien;
		var liens = NS.getXpath(xpath, doc);
		if (liens.length === 0) {
			NS.setError(V.numPage, 'lien', liens);
			console.log('lien introuvable.');
			return false;
		}

		var lien, fils, elem;
		for (var i = 0, len = liens.length; i < len; ++i) {
			lien = liens[i];
			if (!lien) continue;
			if (lien.tagName === 'A') return lien;
			if (fils = lien.getElementsByTagName('a')[0]) return fils;
			elem = lien;
			while (elem = elem.parentNode) if (elem.tagName === 'A') return elem;
		}
		NS.setError(V.numPage, 'lien', liens);
		console.log('lien introuvable.');
		return null;
	};
	NS.getPositionY = function(element) {
		var top = 0;
		while (element) {
			top += element.offsetTop;
			element = element.offsetParent;
		}
		return top;
	};
	NS.getXpath = function(xpath, doc) {
		doc = doc || document;
		var result = document.createExpression(xpath).evaluate(doc),
			contenu = [],
			element;
		while (element = result.iterateNext())
			contenu.push(element);
		return contenu;
	};
	NS.insertAfter = function(newElement, refElement) {
		refElement.parentNode.insertBefore(newElement, refElement.nextSibling);
	};
	NS.insertBefore = function(newElement, refElement) {
		newElement = newElement || V.curDiv;
		refElement = refElement || V.ancreSud;
		refElement.parentNode.insertBefore(newElement, refElement);
	};
	NS.clesCache = 'Les localStorage sont :\n' +
		'"APRules" sous forme de [règle1, règle2, ...].\n' +
		'\tLes règles étant sous la forme {lien: "xpath", adresse: "regExp", contenu: "xpath", ...}.\n' +
		'"APAncre" sous forme de [règle, page1, page2, ...].\n' +
		'\tLa règle est un String :\n' +
		"\t\t'no'\t\t-> l'historique n'est activé que pour les pages déjà listées.\n" +
		"\t\t'all'\t\t-> l'historique est activé pour tout le site.\n" +
		"\t\t'confirm'\t-> il vous sera demandé confirmation avant d'ajouter une page à la liste.\n" +
		'\tLes pages sont sous la forme {adress: "adresse de la page", ancre: Number}\n' +
		'"debugAP" si il est défini, peu importe à quelle valeur, le log sort dans la console.';
	NS.load = function(nbPages) {
		V.resteAcharger = nbPages - 1;
		NS.sbmt();
	};
	NS.masquer = function(doc, xpath) {
		xpath = xpath || NS.xpath.masque;
		if (!xpath)
			return;
		var aMasquer = NS.getXpath(xpath, doc);
		for (var i = 0, len = aMasquer.length; i < len; ++i)
			aMasquer[i].remove();
	};
	NS.newChance = function(numPage) {
		var frame = document.createElement('iframe');
		var curDiv = document.getElementById('autopager_' + numPage);
		var adress = numPage === V.numPage ? V.lien : curDiv.firstElementChild.firstElementChild.href;
		frame.style.display = 'none';
		document.body.appendChild(frame);
		frame.onload = function() {
			var doc = frame.contentDocument;

			if (doc.URL !== adress)
				return NS.noContent(numPage);

			var lien = NS.getLink(doc);
			var nvContenu = NS.getContent(doc);
			NS.masquer(doc);

			if (nvContenu.length === 0) {
				NS.noContent(numPage);
				frame.remove();
				return;
			}

			var h1 = curDiv.querySelector('h1');
			if (h1)
				h1.innerText = doc.title || h1.innerText || '';

			var nextDiv = document.getElementById('autopager_' + (numPage + 1));
			for (var i = 0, l = nvContenu.length; i < l; ++i)
				NS.insertBefore(nvContenu[i] /*.cloneNode(true)*/ , nextDiv);

			NS.scroll.unstop(numPage, lien);
			frame.parentNode.removeChild(frame);
		};
		frame.src = adress;
	};
	NS.noContent = function(numPage) {
		var curDiv = document.getElementById('autopager_' + numPage);

		var erreur = document.createElement('h1');
		erreur.className = 'autopagererror';
		erreur.innerHTML = "AUCUN CONTENU TROUVÉ";
		NS.insertAfter(erreur, curDiv);

		var reessayer = document.createElement('button');
		reessayer.className = 'autopagernewchance';
		reessayer.innerHTML = "Essayer de recharger la page";
		reessayer.onclick = function() {
			reessayer.parentNode.removeChild(erreur);
			reessayer.parentNode.removeChild(reessayer);
			NS.newChance(numPage);
		};
		NS.insertAfter(reessayer, erreur);
	};
	NS.olFram = function() {
		var doc = NS.fram.contentDocument;
		if (doc === null) {
			NS.noContent(V.numPage);
			NS.scroll.stop(V.numPage);
			return;
		}

		NS.masquer(doc);
		var lien = NS.getLink(doc);
		var contenu = NS.getContent(doc);
		V.titre = doc.title || '';

		if (contenu.length === 0) {
			NS.noContent(V.numPage);
		} else
			for (var i = 0; i < contenu.length; ++i)
				NS.insertBefore(contenu[i] /*.cloneNode(true)*/ );

		NS.finirDiv();

		console.log('page ' + V.numPage + ' ajoutée.');

		NS.scroll.toAncre();

		if (!lien) {
			NS.scroll.stop(V.numPage);
			if (V.resteAcharger <= 0)
				V.pageEnChargement = false;
			return;
		}

		V.lien = lien;
		++V.numPage;

		if (V.resteAcharger > 0) {
			--V.resteAcharger;
			NS.sbmt(true);
			return;
		}

		V.positionFin = NS.getPositionY(V.ancreSud);
		V.pageEnChargement = false;
		NS.scrltst();
	};
	NS.path = [{
		adresse: "fr.openclassrooms.com/(informatique|sciences)/cours/",
		contenu: '//div[@class="content-container"]/section | //section[contains(@class,"course-introduction")]',
		lien: '//a[@class="after"]',
		masque: '//div[@class="content-container"]/aside',
		css: 'div.autopager{margin:20px 0px;}.course-introduction{width:100%!important;margin:0!important}.message,.syntaxhighlighter{overflow:visible!important}.gutter div{color:#afafaf}',
	}, {
		adresse: 'fr.openclassrooms.com/forum/categorie/',
		contenu: '//section[@class="paginationContent"]/following-sibling::ul[@class="list"]',
		lien: '//a[@class="paginate next"]',
	}, {
		adresse: 'fr.openclassrooms.com/forum/sujet/',
		contenu: '//section[@class="comments"]',
		lien: '//a[@class="paginate next"]',
		css: 'div.autopager{margin:20px 0px;}.course-introduction{width:100%!important;margin:0!important}.message,.syntaxhighlighter{overflow:visible!important}.gutter div{color:#afafaf}',
	}, {
		adresse: 'galpazmusic.com/artist/',
		contenu: '//div[@class="category-grid-products"]',
		lien: '//li[@class="pager-next"]',
	}, {
		adresse: 'dragonball-multiverse.com/fr/',
		contenu: '//div[@id="content"]/div[@id="dapage"]',
		lien: '//div[@class="navigation"]/a[@rel="next" and contains(text(),"[ » ]")]',
	}, {
		adresse: 'tild-bd.blogspot.fr/.',
		contenu: '//div[@class="post-body entry-content"]/a',
		lien: '//img[@src="http://4.bp.blogspot.com/-BMNwPO_Bm-Y/T5EN7Qs_C7I/AAAAAAAAAFQ/mwBxCzV4sNE/s400/arrow_right.png"]',
		css: '.post-body a img{width:auto!important;height:auto!important}.content-outer{max-width:100%!important;text-align:center;}div.autopager{margin:7px 0px 10px;}',
	}, {
		adresse: 'tomsguide.fr/article/',
		contenu: '//*[@id="news-content"]',
		lien: '//a[contains(text(),"Suivant")]',
	}, {
		adresse: 'forum.downparadise.ws/viewforum.php',
		contenu: '//*[@id="pagecontent"]/table[2]',
		lien: '//a[b[contains(text(),"Suivante")]]',
	}, {
		adresse: 'clubic.com/article',
		contenu: '//div[@class="editorial"]',
		lien: '//a[contains(text(),"Page suivante >")]',
	}, {
		adresse: 'oneshots.eu',
		contenu: '//table[@class="tablo"]',
		lien: '//a[contains(text(),"Suivant >")]',
	}, {
		adresse: 'extreme-down.net/*',
		contenu: "//div[@id='dle-content']",
		lien: "//a[(text()='Suivant →')]",
		masque: "//div[@class='blockbox'][h2/a[contains(text(),'VOSTFR')]]",
	}, {
		adresse: "pcastuces\.com/pratique/*",
		contenu: '//div[@id="contenu2"] | //div[@id="contenu"]',
		lien: '//center/a[u[contains(text(),"suivant")]]',
		masque: '//div[@id="contenu2"]/center[a[u[contains(text(),"suivant")]]]/following-sibling::* | //div[@id="contenu"]/center[a[u[contains(text(),"suivant")]]]/following-sibling::*',
	}, {
		adresse: 'js-attitude.fr/20*',
		contenu: '//article[@role="article"]',
		lien: '//a[contains(@title,"Article suivant")]',
	}, {
		adresse: location.origin,
		contenu: '//a[img[@style]]',
		lien: '//div[@class="sn"]/a[3]'
	}];
	NS.protoDiv = (function() {
		var div = document.createElement('div');
		div.className = 'autopager';

		var img = document.createElement('img');
		img.style.verticalAlign = 'top';
		img.src = "data:image/gif;base64,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";
		div.appendChild(img);

		return div;
	})();
	NS.sbmt = function(force) {
		if ((V.pageEnChargement && !force) || NS.scroll.isDisabled())
			return;

		V.pageEnChargement = true;
		V.ancreSud.id = 'autopager_' + (V.numPage + 1);

		V.curDiv = NS.protoDiv.cloneNode(true);
		V.curDiv.id = 'autopager_' + V.numPage;
		NS.insertBefore();

		if (V.lien && V.lien.onmouseover)
			V.lien.onmouseover();
		NS.fram.src = V.lien.href;
	};
	NS.scrltst = function() {
		if (
			NS.scroll.isOn() && (
				pageYOffset >= V.positionFin - innerHeight * 4 || (+document.URL.split('#autopager_')[1] | 0) > V.numPage
			)
		)
			NS.sbmt();
	};
	NS.scroll = (function() {
		var isActif = false,
			isStop = false,
			scrollUser = false,
			position = [0],
			lenPos = 1,
			page = 0;

		window.addEventListener('scroll', function() {
			scrollUser = true;
		}, false);

		var setButtons = function() {
			var boutons = document.getElementsByClassName('onOff'),
				data = isActif ? 'O' : 'I',
				title = (isActif ? 'Désa' : 'A') + 'ctiver le chargement automatique.';
			for (var i = 0; i < boutons.length; ++i) {
				boutons[i].firstChild.data = data;
				boutons[i].title = title;
			}
		};
		var setAncreSud = function() {
			V.ancreSud.className = ((isActif && !isStop) || page === 2) ? 'autopagercache' : 'autopager';
		};
		var setAncreNord = function() {
			if (page === 2) {
				if (isStop)
					document.getElementById('autopager_1').className = 'autopagercache';
				else
					document.getElementById('autopager_1').className = 'autopager';
			}
		};

		var actions = {
			isOn: function() {
				return isActif;
			},
			isDisabled: function() {
				return isStop;
			},
			on: function(force) {
				if (isActif && !force)
					return console.log('Le scroll est déjà actif.');
				isActif = true;
				console.log('scrollTest activé.');
				setAncreSud();
				setButtons();
				NS.scrltst();
			},
			off: function(force) {
				if (!isActif && !force)
					return console.log('Le scroll est déjà inactif.');
				isActif = false;
				console.log('scrollTest desactivé.');
				setAncreSud();
				setButtons();
			},
			change: function() {
				actions[isActif ? 'off' : 'on']();
			},
			stop: function(numPage) {
				numPage = numPage || V.numPage;
				page = numPage;
				isStop = true;
				setAncreSud();
				setAncreNord();
				if (V.ancre === V.numPage + 1) {
					console.log('scroll a la page ' + V.ancre + '.');
					window.scroll(0, NS.getPositionY(V.ancreSud));
				}
				console.log('Autopager stoppé.');
			},
			unstop: function(numPage, lien) {
				if (numPage !== page || !lien)
					return;
				isStop = false;
				setAncreSud();
				setAncreNord();
				page = 0;
				V.lien = lien;
				++V.numPage;
				console.log('Autopager relancé.');

				if (V.resteAcharger > 0) {
					--V.resteAcharger;
					NS.sbmt(true);
					return;
				}
				V.positionFin = NS.getPositionY(V.ancreSud);
				NS.scrltst();
			},

			toAncre: function() {
				if (scrollUser && V.ancre !== V.numPage)
					return;
				if ((+document.URL.split('#autopager_')[1] | 0) >= V.numPage) {
					console.log('scroll a la page ' + V.numPage + '.');
					window.scroll(0, NS.getPositionY(V.curDiv));
					scrollUser = false;
					if (V.ancre === V.numPage) {
						console.log('préchargement terminé.');
						V.ancre = 0;
					}
				}
			},
			toPos: function(i) {
				if (i > 0)
					window.location = '#autopager_' + i;
				if (i < lenPos)
					position[i] = pageYOffset;
				if (i <= 0)
					scroll(0, 0);
			},
			addPage: function(div) {
				position.push(NS.getPositionY(div));
				++lenPos;
			},
			getPositionY: function() {
				return position;
			},
			keydown: function(e) {
				if (e.srcElement.tagName === 'TEXTAREA' || e.srcElement.tagName === 'INPUT')
					return;
				var key = e.keyCode;
				switch (key) {
					case 37:
					case 39:
						if (document.body.scrollWidth > window.innerWidth)
							return;
					case 83:
					case 88:
						break;
					default:
						return;
				}

				var curPos = pageYOffset;
				var i = 0;
				while (position[++i] <= curPos && i < lenPos);


				switch (key) {
					case 37:
					case 83:
						--i;

						if (position[i] === curPos)
						--i;
						return actions.toPos(i);

					case 39:
					case 88:
						return actions.toPos(i);

					default:
				}
			},
		};
		return actions;
	})();
	NS.setError = function(page, type, error) {
		var err = V.error;
		(err[page] = err[page] || {})[type] = error;
	};
	NS.testRegExp = function(regEx, flags, string) {
		string = string || document.URL;

		var regular = new RegExp(regEx, flags)
		return regular.test(string);
	};
	NS.voirLog = console.afficher;
	NS.xpath = {
		adresse: '',
		contenu: '',
		historique: '',
		lien: '',
		masque: '',
	};
	NS.initialisation = function() {
		NS.initialisation.init = true;
		/*historique*/
		(function() {
			var a = localStorage.getItem('APAncre');
			if (!a)
				return;

			console.log('gestion de l\'historique.');
			var h = JSON.parse(a);
			var adress = window.location.origin + window.location.pathname;
			var item = h.length;
			for (var i = 1, l = item; i < l; ++i) {
				if (h[i].adress === adress) {
					console.log('ancre trouvée pour cette page.');
					item = i;
					if (document.URL !== h[i].adress || !h[i].ancre)
						break;
					window.location = '#autopager_' + h[i].ancre;
					V.ancre = +h[i].ancre | 0;
					break;
				}
			}
			if (item === h.length)
				switch (h[0]) {
					case 'confirm':
						if (!window.confirm('voulez vous activer l\'historique de cette page ?'))
							return;
					case 'all':
						h[item] = {
							adress: adress
						};
						console.log('la page à été ajoutée au gestionnaire d\'historique.');
						break;
					case 'no':
					default:
						console.log('aucune ancre trouvée pour cette page.');
						return;
				}

			window.addEventListener('beforeunload', function() {
				if (!h[item] || h[item].adress !== adress) return;
				h[item].ancre = document.URL.split('#autopager_')[1];
				localStorage.setItem('APAncre', JSON.stringify(h));
			}, false);
			NS.desactiverHistorique = function() {
				window.removeEventListener('beforeunload', bu, false);
			};
			V.historique = h;
		})();

		/*css autopager*/
		NS.css = NS.addCSS(NS.css, 'cssAutoPager');
		console.log('CSS autopager ajoutée');

		/*css locale*/
		if (NS.xpath.css) {
			NS.localCSS = NS.addCSS(NS.xpath.css, 'cssLocalsAutoPager');
			console.log('CSS locale ajoutée.');
		}

		/*masquer dans la page*/
		NS.masquer(document);

		/*récupérer le contenu*/
		var contenu = NS.getXpath(NS.xpath.contenu);
		if (contenu.length === 0) {
			console.log(NS.xpath.contenu);
			console.log('contenu introuvable.');
			return;
		}
		console.log('contenu récupéré.');

		/*placer l'ancre nord*/
		var haut = NS.protoDiv.cloneNode(true);
		haut.id = 'autopager_1';
		NS.finirDiv(haut, true, 1, document.title);
		var flecheHaut = haut.querySelector('a[title="Page haut."]');
		flecheHaut.previousElementSibling.style.marginRight = '36px';
		flecheHaut.remove();
		NS.insertBefore(haut, contenu[0]);
		NS.scroll.addPage(haut);
		console.log('ancre nord placée.');

		/*placer l'ancre sud*/
		var bas = NS.protoDiv.cloneNode(true);
		NS.finirDiv(bas, true, false, false);
		bas.id = "autopager_2";
		bas.className = 'autopagercache';
		var span = bas.firstElementChild;
		flecheHaut = span.querySelector('a[title="Page haut."]');
		flecheHaut.onclick = function() {
			this.href = "#autopager_" + (+this.parentNode.parentNode.id.split("_")[1] - 1);
		};
		flecheHaut.style.marginRight = '36px';
		flecheHaut.nextElementSibling.remove();
		NS.insertAfter(bas, contenu[contenu.length - 1]);
		V.ancreSud = bas;
		V.positionFin = NS.getPositionY(bas);
		console.log('ancre sud placée.');

		/*ajouter les events dans le parent*/
		var parent = V.ancreSud.parentNode;
		parent.addEventListener('click', NS.evt, false);
		console.log('onclick ajouté.');
		parent.addEventListener('keydown', NS.evt, false);
		console.log('onkey "ENTER" down ajouté.');

		/*recuperer le lien dans la page*/
		var lien = NS.getLink();
		if (lien) {
			V.lien = lien;
			console.log('lien récupéré.');
		} else
			NS.scroll.stop();

		/*gestion du bouton on/off*/
		var stop = document.getElementById('stopAutoPagerPortable');
		if (stop) {
			stop.onclick = function(e) {
				e.preventDefault();
				e.stopPropagation();
				NS.scroll.change();
			};
			console.log('bouton stop paramétré.');
		}

		/*creation de l'iframe*/
		var frame = NS.fram;
		frame.style.display = "none";
		frame.onload = function() {
			this.onload = NS.olFram;
			NS.scroll.on();
			window.addEventListener('keydown', NS.scroll.keydown, false);
			if (V.ancre > 1) {
				console.log('préchargement demandé : ' + V.ancre + ' pages.');
				NS.load(V.ancre);
				return;
			}
			if (V.ancre === 1) {
				V.ancre = 0;
				console.log('scroll a la page 1.');
				window.scroll(0, NS.getPositionY(haut));
				return;
			}
			V.ancre = 0;
			NS.scrltst();
		};
		document.body.appendChild(frame);
		console.log('iframe créée.');

		window.addEventListener('scroll', NS.scrltst, false);
		console.log('initialisation terminée avec succés.');
		console.log('');
	};
	NS.testGroupe = function(gr) {
		if (!gr.adresse || !gr.contenu || !gr.lien) return false;
		var retval = {
			adresse: NS.testRegExp(gr.adresse),
			contenu: !!NS.getXpath(gr.contenu),
			lien: !!NS.getXpath(gr.lien)
		};
		if (gr.masque)
			retval.masque = !!NS.getXpath(gr.masque);
		return retval;
	};

	NS.V = V;
	window.NS_AutoPager = NS;
	console.log('NameSpace "NS_AutoPager" créé.');

	(function ini(groupeDeRegles) {
		'use strict';
		if (arguments.length === 0)
			arguments.push(JSON.parse(localStorage.getItem('APRules')));
		var regles;
		for (var i = 0, l = arguments.length; i < l; ++i) {
			regles = arguments[i];
			if (!Array.isArray(regles))
				regles = [];
			for (var j = 0, m = regles.length; j < m; ++j) {
				if (!regles[j].adresse || !NS.testRegExp(regles[j].adresse) /* || !NS.getLink(document, regles[j].lien)*/ )
					continue;
				NS.xpath = regles[j];
				console.log('règles trouvées.');
			}
		}
		if (NS.xpath.adresse) {
			var init = function() {
				if (!NS.initialisation.init)
					NS.initialisation();
			};
			window.addEventListener('load', init);
			setTimeout(init, 1000);
		} else
			window.reini = ini;
	})(NS.path, JSON.parse(localStorage.getItem('APRules')));
})(this);
NS_AutoPager.scroll.off();
NS_AutoPager.fram.onerror = function() {
	NS.noContent(V.numPage);
	NS.scroll.stop(V.numPage);
	return;
};
setInterval(function(){
	document.activeElement.blur();
}, 1000);