import { FETCH_OPTION } from "./constans";
import { Movie, MovieListResponse, TMDBAPIEndpoint } from "./type";

export function getPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageStr = urlParams.get("page") ?? "1";
  const page = isNaN(Number(pageStr)) ? 1 : Number(pageStr);
  return Math.max(1, page);
}

export function setPage(page: number) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(page));
  window.history.replaceState({}, "", url);
}

export async function fetchMovies(endpoint: "/search/movie", params: { query: string, page: number }): Promise<MovieListResponse>
export async function fetchMovies(endpoint: "/movie/popular", params: { page: number }): Promise<MovieListResponse>
export async function fetchMovies(endpoint: TMDBAPIEndpoint, params: Record<string, any>): Promise<MovieListResponse> {
  const queryParams = new URLSearchParams({
    language: "ko-KR",
    ...params
  });
  const response = await fetch(`https://api.themoviedb.org/3${endpoint}?${queryParams}`, FETCH_OPTION)

  if (!response.ok) {
    throw new Error(`API 요청중 에러가 발생했습니다. (${endpoint})`)
  }

  return await response.json() as MovieListResponse
}

export async function fetchMoviesByPageRange(startPage: number, endPage: number) {
  const promises = Array.from({ length: endPage - startPage }).map(
    (_, index) => fetchMovies('/movie/popular', { page: startPage + index + 1 }),
  );

  return Promise.all(promises);
}

export function createMovieItemTemplate(movie: Movie): string {
  return `
    <li>
      <div class="item">
        <img
          class="thumbnail"
          src="https://image.tmdb.org/t/p/w200${movie.poster_path}"
          onerror="this.src='/images/default_movie_image.png'"
          alt="${movie.title}"
        />
        <div class="item-desc">
          <p class="rate">
            <img src="/images/star_empty.png" class="star" />
            <span>${movie.vote_average.toFixed(1)}</span>
          </p>
          <strong>${movie.title}</strong>
        </div>
      </div>
    </li>
  `
}

export function createSkeletonItemTemplate(): string {
  return `
    <li class="skeleton-item">
      <div class="item">
        <div class="skeleton thumbnail"></div>
        <div class="item-desc">
          <div class="skeleton skeleton-rate"></div>
          <div class="skeleton skeleton-title"></div>
        </div>
      </div>
    </li>
  `
}

export function createSkeletonItemsTemplate(count: number): string {
  return Array.from({ length: count }).map(createSkeletonItemTemplate).join("");
}

export function renderSkeletonItems(length: number) {
  document.querySelector(".thumbnail-list")?.insertAdjacentHTML("beforeend", createSkeletonItemsTemplate(length));
}

export function renderTopRatedMovie(movie: Movie) {
  const rateEl = document.querySelector(".top-rated-movie .rate-value");
  const titleEl = document.querySelector(".top-rated-movie .title");
  const detailButtonEl = document.querySelector<HTMLButtonElement>(
    ".top-rated-movie .detail",
  );
  const backgroundContainerEl = document.querySelector<HTMLDivElement>(
    ".background-container",
  );

  if (titleEl) {
    titleEl.textContent = movie.title;
  }

  if (rateEl) {
    rateEl.textContent =
      movie.vote_average.toFixed(1);
  }

  if (detailButtonEl) {
    detailButtonEl.disabled = false;
  }

  if (backgroundContainerEl) {
    backgroundContainerEl.style.backgroundImage = `url(https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${movie.backdrop_path})`;
  }
}

export function renderMovies(movieList: Movie[]) {
  document.querySelector(".thumbnail-list")?.insertAdjacentHTML(
    "beforeend",
    movieList.map((movie) => createMovieItemTemplate(movie)).join(""),
  );
}

export function renderShowMoreButton(prevResponseList: MovieListResponse[], page: number, callback: () => void) {
  if (
    prevResponseList.length &&
    prevResponseList[prevResponseList.length - 1].total_pages > page
  ) {
    if (!document.querySelector(".show-more-button")) {
      const button = document.createElement("button");
      button.classList.add("show-more-button");
      button.textContent = "더보기";
      button.addEventListener("click", callback);
      document
        .querySelector(".thumbnail-list")
        ?.insertAdjacentElement("afterend", button);
    }
  } else {
    const showMoreButtonEl = document.querySelector(".show-more-button");
    showMoreButtonEl?.parentElement?.removeChild(showMoreButtonEl);
  }
}

export function removeSkeletonItem() {
  document
    .querySelectorAll(".skeleton-item")
    .forEach((element) => element.remove());
}