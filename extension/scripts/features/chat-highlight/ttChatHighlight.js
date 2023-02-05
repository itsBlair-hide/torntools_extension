"use strict";

(async () => {
	if (is2FACheckPage()) return;

	let highlights;

	const feature = featureManager.registerFeature(
		"Chat Highlight",
		"chat",
		() => settings.pages.chat.highlights.length,
		initialiseHighlights,
		readSettings,
		removeHighlights,
		{
			storage: ["settings.pages.chat.highlights"],
		},
		null
	);

	function initialiseHighlights() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (!feature.enabled()) return;

			applyHighlights(message);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			for (const message of chat.findAll("[class*='message_']")) {
				applyHighlights(message);
			}
		});
	}

	function readSettings() {
		highlights = settings.pages.chat.highlights.map((highlight) => {
			let { name, color } = highlight;

			for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
				if (name !== placeholder.name) continue;

				name = placeholder.value();
				break;
			}

			return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
		});

		requireChatsLoaded().then(() => {
			removeHighlights();

			for (const message of document.findAll("[class*='_chat-box-content_'] [class*='_overview_'] [class*='_message_']")) {
				applyHighlights(message);
			}
		});
	}

	function applyHighlights(message) {
		if (!message) {
			console.log("!message");
			return;
		}
		if (!message.find) console.log("DKK highlightChat", { message });
		if (!highlights.length) {
			console.log("!highlights.length");
			return;
		}
		const sender = simplify(message.find("a").textContent).slice(0, -1);
		const words = message.find("span").textContent.split(" ").map(simplify);

		const senderHighlights = highlights.filter(({ name }) => name === sender || name === "*");
		if (senderHighlights.length) {
			message.find("a").style.color = senderHighlights[0].senderColor;
			message.find("a").classList.add("tt-highlight");
		} else {
			if(!message.find("a").getAttribute("title")) {
				message.find("a").style.color = "rgb(255,175,255)";
				message.find("a").classList.add("tt-highlight");
			}
		}

		for (const { name, color } of highlights) {
			// if (!words.includes(name)) continue;
			for(var word of words) {
				if(word.includes(name)) {
					message.find("span").parentElement.style.backgroundColor = color;
					message.find("span").classList.add("tt-highlight");
					break;
				}
			}
		}

		function simplify(text) {
			return text.toLowerCase().trim();
		}
	}

	function removeHighlights() {
		for (const message of document.findAll("[class*='_chat-box-content_'] [class*='_overview_'] [class*='_message_'] .tt-highlight")) {
			message.style.color = "unset";
			message.classList.remove("tt-highlight");
		}
	}
})();
