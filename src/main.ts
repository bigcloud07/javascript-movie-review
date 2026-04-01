interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  popularity: number;
  vote_average: number;
  vote_count: number;
  poster_path: string;
  backdrop_path: string;
  adult: boolean;
  video: boolean;
  original_language: string;
}

interface MovieListResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

function createSkeletonItems(count: number): string {
  return Array.from({ length: count })
    .map(
      () => `
      <li class="skeleton-item">
        <div class="item">
          <div class="skeleton thumbnail"></div>
          <div class="item-desc">
            <div class="skeleton skeleton-rate"></div>
            <div class="skeleton skeleton-title"></div>
          </div>
        </div>
      </li>
    `,
    )
    .join("");
}

async function fetchMoviesByPageRange(startPage: number, endPage: number) {
  const promises = Array.from({ length: endPage - startPage }).map(
    async (_, index) => {
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        },
      };

      const response = (await (
        await fetch(
          `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${startPage + index + 1}`,
          options,
        )
      ).json()) as MovieListResponse;

      return response;
    },
  );

  return Promise.all(promises);
}

addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pageStr = urlParams.get("page") ?? "1";

  let page = isNaN(Number(pageStr)) ? 1 : Number(pageStr);
  let prevResponseList: MovieListResponse[] = [];

  async function renderMoviePage(page: number) {
    page = Math.max(1, page);

    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.replaceState({}, "", url);

    const thumbnailList = document.querySelector(".thumbnail-list")!;
    thumbnailList.insertAdjacentHTML("beforeend", createSkeletonItems(20));

    const responseList = await fetchMoviesByPageRange(
      prevResponseList.length,
      page,
    );

    document
      .querySelectorAll(".skeleton-item")
      .forEach((element) => element.remove());

    prevResponseList.push(...responseList);

    const movieList = responseList.reduce((arr: Movie[], response) => {
      return [...arr, ...response.results];
    }, []);

    document.querySelector(".thumbnail-list")?.insertAdjacentHTML(
      "beforeend",
      movieList
        .map(
          (movie) => `
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
      `,
        )
        .join(""),
    );

    if (
      prevResponseList.length &&
      prevResponseList[prevResponseList.length - 1].total_pages > page
    ) {
      if (!document.querySelector(".show-more-button")) {
        const button = document.createElement("button");
        button.classList.add("show-more-button");
        button.textContent = "더보기";
        button.addEventListener("click", async () => {
          page++;
          await renderMoviePage(page);
        });
        document
          .querySelector(".thumbnail-list")
          ?.insertAdjacentElement("afterend", button);
      }
    } else {
      const showMoreButtonEl = document.querySelector(".show-more-button");
      showMoreButtonEl?.parentElement?.removeChild(showMoreButtonEl);
    }
  }

  await renderMoviePage(page);

  if (prevResponseList.length && prevResponseList[0].results.length) {
    const rateEl = document.querySelector(".top-rated-movie .rate-value");
    const titleEl = document.querySelector(".top-rated-movie .title");
    const detailButtonEl = document.querySelector<HTMLButtonElement>(
      ".top-rated-movie .detail",
    );
    const backgroundContainerEl = document.querySelector<HTMLDivElement>(
      ".background-container",
    );

    if (titleEl) {
      titleEl.textContent = prevResponseList[0].results[0].title;
    }

    if (rateEl) {
      rateEl.textContent =
        prevResponseList[0].results[0].vote_average.toFixed(1);
    }

    if (detailButtonEl) {
      detailButtonEl.disabled = false;
    }

    if (backgroundContainerEl) {
      backgroundContainerEl.style.backgroundImage = `url(https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${prevResponseList[0].results[0].backdrop_path})`;
    }
  }
});
