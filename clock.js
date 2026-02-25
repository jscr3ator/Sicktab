const SETTINGS_KEY = "sicktab:settings";

function readSettings() {
	const defaults = {
		use24Hour: false,
		showSeconds: true,
	};

	const rawSettings = localStorage.getItem(SETTINGS_KEY);
	if (!rawSettings) {
		return defaults;
	}

	try {
		return { ...defaults, ...JSON.parse(rawSettings) };
	} catch {
		return defaults;
	}
}

function padTwo(value) {
	return String(value).padStart(2, "0");
}

function renderClock() {
	const now = new Date();
	const settings = readSettings();
	const timeElement = document.getElementById("time");
	const dateElement = document.getElementById("date");

	if (!timeElement || !dateElement) {
		return;
	}

	let hours = now.getHours();
	if (!settings.use24Hour) {
		hours = hours % 12 || 12;
	}

	const minutes = padTwo(now.getMinutes());
	const seconds = padTwo(now.getSeconds());
	const timeText = settings.showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
	timeElement.textContent = timeText;

	const month = padTwo(now.getMonth() + 1);
	const day = padTwo(now.getDate());
	const year = String(now.getFullYear()).slice(-2);
	dateElement.textContent = `${month}/${day}/${year}`;
}

renderClock();
setInterval(renderClock, 1000);