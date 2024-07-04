// ==UserScript==
// @name        NexusNoDelay - Instant Download
// @name:tr	    Nexus Beklemeden Mod İndir
// @description: Quickly download mods from Nexusmods.com without waiting and without redirection (Manual/Vortex/MO2/NMM supported.
// @description:tr Nexusmods.com'dan modları beklemeden ve yönlendirme olmadan hızlıca indirin (Manual/Vortex/MO2/NMM destekli)
// @namespace   https://github.com/ilker-binzet
// @match     	*://www.nexusmods.com/*/mods/*
// @version     2024.7.4
// @license     MIT
// @compatible          chrome
// @compatible          firefox
// @compatible          edge
// @compatible          opera
// @compatible          brave
// @compatible          vivaldi
// @compatible          waterfox
// @compatible          librewolf
// @compatible          ghost
// @compatible          qq
// @run-at      document-idle
// @author	ilker Binzet
// ==/UserScript==

/*
 * Bu script, Ilker Binzet tarafından oluşturulmuştur.
 * © 2024 Ilker Binzet. Tüm hakları saklıdır.
 */

(function () {
	let ajaxIstekHam;

	if (typeof(GM_xmlhttpRequest) !== "undefined") {
		ajaxIstekHam = GM_xmlhttpRequest;
	} else if (typeof(GM) !== "undefined" && typeof(GM.xmlHttpRequest) !== "undefined") {
		ajaxIstekHam = GM.xmlHttpRequest;
	}

	function ajaxIstek(obj) {
		if (!ajaxIstekHam) {
			console.log("İstek yapılamıyor", obj);
			return;
		}

		const istekObjesi = {
			url: obj.url,
			method: obj.type,
			data: obj.data,
			headers: obj.headers
		};

		let yuklenmeCb = function (sonuc) {
			if (sonuc.readyState !== 4) {
				return;
			}

			if (sonuc.status !== 200) {
				return obj.error(sonuc);
			}

			return obj.success(sonuc.responseText);
		};

		istekObjesi.onload = yuklenmeCb;
		istekObjesi.onerror = yuklenmeCb;

		ajaxIstekHam(istekObjesi);
	}

	function butonHata(buton) {
		buton.style.color = "white";
		buton.style.backgroundColor = "red";
		buton.style.fontSize = "16px";
		buton.style.fontWeight = "bold";
		buton.innerText = "HATA";
	}

	function butonBasari(buton) {
		buton.style.color = "white";
		buton.style.backgroundColor = "green";
		buton.style.fontSize = "16px";
		buton.style.fontWeight = "bold";
		buton.innerText = "YÜKLENİYOR";
	}

	function butonBekle(buton) {
		buton.style.color = "black";
		buton.style.backgroundColor = "yellow";
		buton.style.fontSize = "16px";
		buton.style.fontWeight = "bold";
		buton.innerText = "LÜTFEN BEKLE";
	}

	function tiklamaDinleyici(event) {
		const href = this.href || window.location.href;
		const params = new URL(href).searchParams;

		if (params.get("file_id")) {
			let buton = event;
			if (this.href) {
				buton = this;
				event.preventDefault();
			}
			butonBekle(buton);

			const section = document.getElementById("section");
			const gameId = section ? section.dataset.gameId : this.current_game_id;

			let fileId = params.get("file_id");
			if (!fileId) {
				fileId = params.get("id");
			}

			if (!params.get("nmm")) {
				ajaxIstek({
					type: "POST",
					url: "/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl",
					data: "fid=" + fileId + "&game_id=" + gameId,
					headers: {
						Origin: "https://www.nexusmods.com",
						Referer: href,
						"Sec-Fetch-Site": "same-origin",
						"X-Requested-With": "XMLHttpRequest",
						"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
					},
					success(data) {
						if (data) {
							try {
								data = JSON.parse(data);

								if (data.url) {
									butonBasari(buton);
									document.location.href = data.url;
								}
							} catch (e) {
								console.error(e);
							}
						}
					},
					error() {
						butonHata(buton);
					}
				});
			} else {
				ajaxIstek({
					type: "GET",
					url: href,
					headers: {
						Origin: "https://www.nexusmods.com",
						Referer: document.location.href,
						"Sec-Fetch-Site": "same-origin",
						"X-Requested-With": "XMLHttpRequest"
					},
					success(data) {
						if (data) {
							const xml = new DOMParser().parseFromString(data, "text/html");
							const yavas = xml.getElementById("slowDownloadButton");
							const downloadUrl = yavas.getAttribute("data-download-url");
							butonBasari(buton);
							document.location.href = downloadUrl;
						}
					},
					error(ajaxContext) {
						console.error(ajaxContext.responseText);
						butonHata(buton);
					}
				});
			}

			const popup = this.parentNode;
			if (popup && popup.classList.contains("popup")) {
				popup.getElementsByTagName("button")[0].click();
				const popupButton = document.getElementById("popup" + fileId);
				if (popupButton) {
					butonBasari(popupButton);
				}
			}
		} else if (/ModRequirementsPopUp/.test(href)) {
			const fileId = params.get("id");

			if (fileId) {
				this.setAttribute("id", "popup" + fileId);
			}
		}
	}

	function tiklamaDinleyiciEkle(el) {
		el.addEventListener("click", tiklamaDinleyici, true);
	}

	function tiklamaDinleyicileriEkle(els) {
		for (let i = 0; i < els.length; i++) {
			tiklamaDinleyiciEkle(els[i]);
		}
	}

	function otomatikBaslatDosyaLinki() {
		if (/file_id=/.test(window.location.href)) {
			tiklamaDinleyici(document.getElementById("slowDownloadButton"));
		}
	}

	function arsivDosyasi() {
		if (/[?&]category=archived/.test(window.location.href)) {
			const fileIds = document.getElementsByClassName("file-expander-header");
			const elements = document.getElementsByClassName("accordion-downloads");
            const path = `${location.protocol}//${location.host}${location.pathname}`;
			for (let i = 0; i < elements.length; i++) {
				elements[i].innerHTML = ''
                    + `<li><a class="btn inline-flex" href="${path}?tab=files&amp;file_id=${fileIds[i].getAttribute("data-id")}&amp;nmm=1" tabindex="0">`
					+ "<svg title=\"\" class=\"icon icon-nmm\"><use xlink:href=\"https://www.nexusmods.com/assets/images/icons/icons.svg#icon-nmm\"></use></svg> <span class=\"flex-label\">Mod yöneticisi ile indir</span>"
					+ "</a></li><li></li><li>"
					+ `<li><a class="btn inline-flex" href="${path}?tab=files&amp;file_id=${fileIds[i].getAttribute("data-id")}" tabindex="0">`
					+ "<svg title=\"\" class=\"icon icon-manual\"><use xlink:href=\"https://www.nexusmods.com/assets/images/icons/icons.svg#icon-manual\"></use></svg> <span class=\"flex-label\">Manuel indir</span>"
					+ "</a></li>";
			}
		}
	}

	arsivDosyasi();
	tiklamaDinleyicileriEkle(document.querySelectorAll("a.btn"));
	otomatikBaslatDosyaLinki();

	let gozlemci = new MutationObserver(((mutations, observer) => {
		for (let i = 0; i < mutations.length; i++) {
			if (mutations[i].addedNodes) {
				for (let x = 0; x < mutations[i].addedNodes.length; x++) {
					const node = mutations[i].addedNodes[x];

					if (node.tagName === "A" && node.classList.contains("btn")) {
						tiklamaDinleyiciEkle(node);
					} else if (node.children && node.children.length > 0) {
						tiklamaDinleyicileriEkle(node.querySelectorAll("a.btn"));
					}
				}
			}
		}
	}));
	gozlemci.observe(document, {childList: true, subtree: true});
})();