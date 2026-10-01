const quotes = [
	{ film: "Star Wars", year: 1977, quote: "Que a Força esteja com você." },
	{ film: "O Poderoso Chefão", year: 1972, quote: "Vou fazer uma oferta que ele não poderá recusar." },
	{ film: "Forrest Gump", year: 1994, quote: "A vida é como uma caixa de chocolates, você nunca sabe o que vai encontrar." },
	{ film: "O Senhor dos Anéis", year: 2001, quote: "Um anel para a todos governar, um anel para encontrar, um anel para a todos trazer e na escuridão aprisioná-los." },
	{ film: "De Volta para o Futuro", year: 1985, quote: "Onde estamos indo, não precisamos de estradas." },
	{ film: "O Exorcista", year: 1973, quote: "O que você quer, meu filho?" },
	{ film: "Clube da Luta", year: 1999, quote: "A primeira regra do Clube da Luta é: você não fala sobre o Clube da Luta." },
	{ film: "O Grande Lebowski", year: 1998, quote: "Isso é apenas uma bola de bowling, nada mais." },
	{ film: "Matrix", year: 1999, quote: "Não há colher." },
	{ film: "Titanic", year: 1997, quote: "Eu sou o rei do mundo!" }
];

const grid = document.querySelector("#quote-grid");
const searchInput = document.querySelector("#search-input");
const decadeFilter = document.querySelector("#decade-filter");
const favoritesFilter = document.querySelector("#favorites-filter");
const favoriteCount = document.querySelector("#favorite-count");
const visibleCount = document.querySelector("#visible-count");
const emptyState = document.querySelector("#empty-state");
const toast = document.querySelector("#toast");

let favorites = loadFavorites();
let showFavorites = false;
let toastTimer;

function loadFavorites() {
	try {
		const saved = JSON.parse(localStorage.getItem("fala-cinema-favorites") || "[]");
		return new Set(saved.filter((film) => quotes.some((quote) => quote.film === film)));
	} catch {
		return new Set();
	}
}

function normalize(text) {
	return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function renderQuotes() {
	const term = normalize(searchInput.value.trim());
	const decade = decadeFilter.value;
	const visibleQuotes = quotes.filter((item) => {
		const matchesSearch = normalize(`${item.film} ${item.quote}`).includes(term);
		const matchesDecade = decade === "all" || String(Math.floor(item.year / 10) * 10) === decade;
		const matchesFavorite = !showFavorites || favorites.has(item.film);
		return matchesSearch && matchesDecade && matchesFavorite;
	});

	grid.innerHTML = visibleQuotes.map((item) => {
		const index = String(quotes.indexOf(item) + 1).padStart(2, "0");
		const isFavorite = favorites.has(item.film);
		return `
			<article class="quote-card">
				<div class="card-top">
					<span class="card-number">${index} / 10</span>
					<button class="favorite-button${isFavorite ? " is-favorite" : ""}" type="button" data-favorite="${item.film}" aria-label="${isFavorite ? "Remover dos" : "Adicionar aos"} favoritos" aria-pressed="${isFavorite}">♥</button>
				</div>
				<blockquote class="quote-text">“${item.quote}”</blockquote>
				<div class="card-footer">
					<div><span class="film-title">${item.film}</span><span class="film-year">${item.year}</span></div>
					<button class="copy-button" type="button" data-copy="${item.film}" aria-label="Copiar frase de ${item.film}"><span aria-hidden="true">▢</span><span>Copiar</span></button>
				</div>
			</article>`;
	}).join("");

	visibleCount.textContent = visibleQuotes.length;
	favoriteCount.textContent = favorites.size;
	emptyState.hidden = visibleQuotes.length > 0;
}

function notify(message) {
	toast.textContent = message;
	toast.classList.add("is-visible");
	window.clearTimeout(toastTimer);
	toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

searchInput.addEventListener("input", renderQuotes);
decadeFilter.addEventListener("change", renderQuotes);

favoritesFilter.addEventListener("click", () => {
	showFavorites = !showFavorites;
	favoritesFilter.setAttribute("aria-pressed", String(showFavorites));
	renderQuotes();
});

document.querySelector("#favorites-link").addEventListener("click", () => {
	showFavorites = true;
	favoritesFilter.setAttribute("aria-pressed", "true");
	renderQuotes();
});

document.addEventListener("click", async (event) => {
	const favoriteButton = event.target.closest("[data-favorite]");
	if (favoriteButton) {
		const film = favoriteButton.dataset.favorite;
		if (favorites.has(film)) favorites.delete(film);
		else favorites.add(film);
		localStorage.setItem("fala-cinema-favorites", JSON.stringify([...favorites]));
		renderQuotes();
		return;
	}

	const copyButton = event.target.closest("[data-copy]");
	if (copyButton) {
		const item = quotes.find((quote) => quote.film === copyButton.dataset.copy);
		try {
			await navigator.clipboard.writeText(`“${item.quote}” — ${item.film}`);
			notify("Frase copiada.");
		} catch {
			notify("Não foi possível copiar neste navegador.");
		}
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "/" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
		event.preventDefault();
		searchInput.focus();
	}
});

renderQuotes();
