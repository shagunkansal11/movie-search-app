// OMDb API KEY
const API_KEY = "a939e296";

// ELEMENTS
const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const container = document.getElementById("movieContainer");
const message = document.getElementById("message");
const title = document.getElementById("resultTitle");
const count = document.getElementById("resultCount");
const loadMore = document.getElementById("loadMore");

const favoriteContainer = document.getElementById("favoriteContainer");
const modal = document.getElementById("movieModal");
const movieDetails = document.getElementById("movieDetails");
const closeModal = document.getElementById("closeModal");

let currentSearch = "";
let currentPage = 1;
let totalResults = 0;

let favorites = JSON.parse(localStorage.getItem("reelfinderFavorites")) || [];


// SEARCH MOVIES
async function searchMovies(name, page = 1) {

    if (page === 1) {
        container.innerHTML = "";
        currentSearch = name;
        currentPage = 1;
        message.textContent = "Searching movies...";
    }

    loadMore.hidden = true;

    try {

        const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(name)}&type=movie&page=${page}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === "False") {

            if (page === 1) {
                container.innerHTML = "";
                message.textContent = data.Error;
                count.textContent = "";
            }

            return;
        }

        totalResults = Number(data.totalResults);

        title.textContent = `Results for "${name}"`;
        count.textContent = `${totalResults} movies found`;

        message.textContent = "";

        data.Search.forEach(movie => {

            const poster = movie.Poster !== "N/A"
                ? movie.Poster
                : "https://placehold.co/300x450?text=No+Poster";

            const isFavorite = favorites.some(
                fav => fav.imdbID === movie.imdbID
            );

            const card = document.createElement("div");

            card.className = "movie-card";

            card.innerHTML = `
                <img
                    src="${poster}"
                    class="movie-poster"
                    alt="Movie poster"
                >

                <div class="movie-info">

                    <h3>${movie.Title}</h3>

                    <p>Year: ${movie.Year}</p>

                    <p>Type: ${movie.Type}</p>

                    <div class="card-buttons">

                        <button
                            class="details-btn"
                            data-id="${movie.imdbID}">
                            Details
                        </button>

                        <button
                            class="favorite-btn"
                            data-id="${movie.imdbID}">
                            ${isFavorite ? "♥ Saved" : "♡ Save"}
                        </button>

                    </div>

                </div>
            `;

            container.appendChild(card);

        });

        currentPage = page;

        loadMore.hidden = currentPage * 10 >= totalResults;

    } catch (error) {

        message.textContent = "Unable to fetch movies. Check your internet connection.";

        console.error(error);

    }

}


// SEARCH FORM
form.addEventListener("submit", function(e) {

    e.preventDefault();

    const name = input.value.trim();

    if (name) {
        searchMovies(name, 1);
    }

});


// QUICK SEARCH
document.querySelectorAll(".suggestion").forEach(button => {

    button.addEventListener("click", function() {

        input.value = this.textContent;

        searchMovies(this.textContent, 1);

    });

});


// LOAD MORE
loadMore.addEventListener("click", function() {

    if (currentSearch && currentPage * 10 < totalResults) {

        searchMovies(currentSearch, currentPage + 1);

    }

});


// MOVIE CARD BUTTONS
container.addEventListener("click", function(e) {

    const id = e.target.dataset.id;

    if (!id) return;

    if (e.target.classList.contains("details-btn")) {

        showMovieDetails(id);

    }

    if (e.target.classList.contains("favorite-btn")) {

        toggleFavorite(id);

    }

});


// GET MOVIE DETAILS
async function showMovieDetails(id) {

    movieDetails.innerHTML = "<p>Loading movie details...</p>";

    modal.style.display = "flex";

    try {

        const url = `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=full`;

        const response = await fetch(url);

        const data = await response.json();

        if (data.Response === "False") {
            movieDetails.textContent = data.Error;
            return;
        }

        const poster = data.Poster !== "N/A"
            ? data.Poster
            : "https://placehold.co/300x450?text=No+Poster";

        movieDetails.innerHTML = `

            <div class="modal-movie">

                <img src="${poster}" alt="Movie poster">

                <div class="modal-info">

                    <h2>${data.Title}</h2>

                    <p><b>Year:</b> ${data.Year}</p>

                    <p><b>Genre:</b> ${data.Genre}</p>

                    <p><b>Director:</b> ${data.Director}</p>

                    <p><b>Actors:</b> ${data.Actors}</p>

                    <p><b>IMDb Rating:</b> ⭐ ${data.imdbRating}</p>

                    <p><b>Runtime:</b> ${data.Runtime}</p>

                    <p><b>Plot:</b> ${data.Plot}</p>

                </div>

            </div>

        `;

    } catch (error) {

        movieDetails.textContent = "Unable to load movie details.";

        console.error(error);

    }

}


// CLOSE MODAL
closeModal.addEventListener("click", function() {

    modal.style.display = "none";

});

modal.addEventListener("click", function(e) {

    if (e.target === modal) {
        modal.style.display = "none";
    }

});


// ADD OR REMOVE FAVORITES
async function toggleFavorite(id) {

    const existing = favorites.find(movie => movie.imdbID === id);

    if (existing) {

        favorites = favorites.filter(
            movie => movie.imdbID !== id
        );

    } else {

        try {

            const url = `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`;

            const response = await fetch(url);

            const data = await response.json();

            if (data.Response === "False") return;

            favorites.push({
                imdbID: data.imdbID,
                Title: data.Title,
                Year: data.Year,
                Poster: data.Poster
            });

        } catch (error) {

            console.error(error);
            return;

        }

    }

    localStorage.setItem(
        "reelfinderFavorites",
        JSON.stringify(favorites)
    );

    renderFavorites();

    // Refresh search cards to update saved buttons
    if (currentSearch) {
        searchMovies(currentSearch, 1);
    }

}


// DISPLAY FAVORITES
function renderFavorites() {

    favoriteContainer.innerHTML = "";

    if (favorites.length === 0) {

        favoriteContainer.innerHTML = `
            <p class="empty-favorites">
                Your watchlist is empty. Save a movie you like!
            </p>
        `;

        return;

    }

    favorites.forEach(movie => {

        const poster = movie.Poster !== "N/A"
            ? movie.Poster
            : "https://placehold.co/300x450?text=No+Poster";

        const card = document.createElement("div");

        card.className = "movie-card";

        card.innerHTML = `

            <img
                src="${poster}"
                class="movie-poster"
                alt="Movie poster"
            >

            <div class="movie-info">

                <h3>${movie.Title}</h3>

                <p>${movie.Year}</p>

                <div class="card-buttons">

                    <button
                        class="details-btn"
                        data-id="${movie.imdbID}">
                        Details
                    </button>

                    <button
                        class="favorite-btn remove-favorite"
                        data-id="${movie.imdbID}">
                        Remove
                    </button>

                </div>

            </div>

        `;

        favoriteContainer.appendChild(card);

    });

}


// WATCHLIST BUTTONS
favoriteContainer.addEventListener("click", function(e) {

    const id = e.target.dataset.id;

    if (!id) return;

    if (e.target.classList.contains("details-btn")) {

        showMovieDetails(id);

    }

    if (e.target.classList.contains("remove-favorite")) {

        toggleFavorite(id);

    }

});


// INITIALIZE WATCHLIST
renderFavorites();