(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const FETCH_OPTION = {
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZGZkMWJkYzUyMmQ1ODJmNzg1OTE4ZjU1MGQwNTQxNSIsIm5iZiI6MTc3NDg1MDM2Mi43MTUwMDAyLCJzdWIiOiI2OWNhMTEzYTExY2ZiOWQxYWE2MzZmNTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.umC9BVxmNyk5U-H5DSbZsnPJ-0DIzDuwx-6R54Ims_g"}`
  }
};
const FETCH_TIMEOUT_MS = 1e4;
const RATING_LABELS = {
  2: "최악이에요",
  4: "별로예요",
  6: "보통이에요",
  8: "재미있어요",
  10: "명작이에요"
};
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function timeoutFn(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`요청 시간이 ${ms}ms를 초과했습니다.`));
    }, ms);
  });
}
async function fetchMovies(endpoint, params) {
  const queryParams = new URLSearchParams({
    language: "ko-KR",
    ...params
  });
  try {
    const fetchPromise = fetch(`${"https://api.themoviedb.org/3"}${endpoint}?${queryParams}`, FETCH_OPTION).then(async (res) => {
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.status_message ?? `${res.status} ${res.statusText}`);
      }
      return res.json();
    });
    return await Promise.race([fetchPromise, timeoutFn(FETCH_TIMEOUT_MS)]);
  } catch (error) {
    const newError = new Error();
    newError.name = "API 요청중 에러가 발생했습니다.";
    newError.message = `${error instanceof Error ? error.message ?? "not found error message" : "not found error"} (${endpoint})`;
    throw newError;
  }
}
async function fetchPopularMoviesByPageRange(startPage, endPage) {
  const promises = Array.from({ length: endPage - startPage }).map(
    async (_, index) => {
      if (index !== 0) await delay(index * 200);
      return fetchMovies("/movie/popular", { page: startPage + index + 1 });
    }
  );
  return Promise.all(promises);
}
async function fetchSearchMoviesByPageRange(startPage, endPage, query) {
  const promises = Array.from({ length: endPage - startPage }).map(
    async (_, index) => {
      if (index !== 0) await delay(index * 200);
      return fetchMovies("/search/movie", { query, page: startPage + index + 1 });
    }
  );
  return Promise.all(promises);
}
async function fetchMovieDetail(id) {
  const endpoint = `/movie/${id}`;
  const queryParams = new URLSearchParams({ language: "ko-KR" });
  try {
    const fetchPromise = fetch(`${"https://api.themoviedb.org/3"}${endpoint}?${queryParams}`, FETCH_OPTION).then(async (res) => {
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.status_message ?? `${res.status} ${res.statusText}`);
      }
      return res.json();
    });
    return await Promise.race([fetchPromise, timeoutFn(FETCH_TIMEOUT_MS)]);
  } catch (error) {
    const newError = new Error();
    newError.name = "API 요청중 에러가 발생했습니다.";
    newError.message = `${error instanceof Error ? error.message ?? "not found error message" : "not found error"} (${endpoint})`;
    throw newError;
  }
}
function getPramFromURL(name, defaultValue) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name) ?? defaultValue;
}
function getQuery() {
  return getPramFromURL("query", "");
}
function getPage() {
  const pageStr = getPramFromURL("page", "1");
  const page = isNaN(Number(pageStr)) ? 1 : Number(pageStr);
  return Math.max(1, page);
}
function setQuery(query) {
  const url = new URL(window.location.href);
  url.searchParams.set("query", query);
  window.history.replaceState({}, "", url);
}
function setPage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(page));
  window.history.replaceState({}, "", url);
}
const localStorageRatingStore = {
  getRating(movieId) {
    const stored = localStorage.getItem(`movie-rating:${movieId}`);
    return stored !== null ? Number(stored) : null;
  },
  setRating(movieId, rating) {
    localStorage.setItem(`movie-rating:${movieId}`, String(rating));
  }
};
const ratingStore = localStorageRatingStore;
const TOAST_DURATION_MS = 5e3;
function createToast({ title, message }) {
  const toast = document.createElement("div");
  toast.className = "toast";
  const body = document.createElement("div");
  const titleEl = document.createElement("p");
  titleEl.className = "toast-title";
  titleEl.textContent = title ?? "";
  body.appendChild(titleEl);
  const messageEl = document.createElement("p");
  messageEl.className = "toast-message";
  messageEl.textContent = message;
  body.appendChild(messageEl);
  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.setAttribute("aria-label", "닫기");
  closeBtn.textContent = "✕";
  toast.appendChild(body);
  toast.appendChild(closeBtn);
  closeBtn.addEventListener("click", () => removeToast(toast));
  return toast;
}
function removeToast(toast) {
  toast.classList.add("toast-hide");
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}
function getOrCreateContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}
function showErrorToast({ title, message }) {
  const container = getOrCreateContainer();
  const toast = createToast({ title, message });
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.isConnected) removeToast(toast);
  }, TOAST_DURATION_MS);
}
function throttle(callback) {
  let inFlight = null;
  return (...args) => {
    if (inFlight) return;
    inFlight = Promise.resolve(callback(...args)).finally(() => {
      inFlight = null;
    });
  };
}
function createMovieItemTemplate(movie) {
  const li = document.createElement("li");
  const item = document.createElement("div");
  item.className = "item";
  const img = document.createElement("img");
  img.className = "thumbnail";
  img.src = `${"https://image.tmdb.org/t/p"}/w200${movie.poster_path}`;
  img.alt = movie.title;
  img.addEventListener("error", () => {
    img.src = "/images/default_movie_image.png";
  }, { once: true });
  item.addEventListener("click", () => {
    handleMovieClick(movie.id);
  });
  const itemDesc = document.createElement("div");
  itemDesc.className = "item-desc";
  const rateP = document.createElement("p");
  rateP.className = "rate";
  const starImg = document.createElement("img");
  starImg.src = `${"/javascript-movie-review/"}images/star_empty.png`;
  starImg.className = "star";
  const rateSpan = document.createElement("span");
  rateSpan.textContent = movie.vote_average.toFixed(1);
  rateP.appendChild(starImg);
  rateP.appendChild(rateSpan);
  const titleP = document.createElement("p");
  titleP.className = "movie-title";
  titleP.textContent = movie.title;
  itemDesc.appendChild(rateP);
  itemDesc.appendChild(titleP);
  item.appendChild(img);
  item.appendChild(itemDesc);
  li.appendChild(item);
  return li;
}
function createSkeletonItemTemplate() {
  const li = document.createElement("li");
  li.className = "skeleton-item";
  const item = document.createElement("div");
  item.className = "item";
  const thumbnail = document.createElement("div");
  thumbnail.className = "skeleton thumbnail";
  const itemDesc = document.createElement("div");
  itemDesc.className = "item-desc";
  const rate = document.createElement("div");
  rate.className = "skeleton skeleton-rate";
  const title = document.createElement("div");
  title.className = "skeleton skeleton-title";
  itemDesc.appendChild(rate);
  itemDesc.appendChild(title);
  item.appendChild(thumbnail);
  item.appendChild(itemDesc);
  li.appendChild(item);
  return li;
}
function renderSkeletonItems(length) {
  const list = document.querySelector(".thumbnail-list");
  if (!list) return;
  Array.from({ length }).forEach(() => list.appendChild(createSkeletonItemTemplate()));
}
function renderTopRatedMovie(movie) {
  const rateEl = document.querySelector(".top-rated-movie .rate-value");
  const titleEl = document.querySelector(".top-rated-movie .title");
  const detailButtonEl = document.querySelector(
    ".top-rated-movie .detail"
  );
  const backgroundContainerEl = document.querySelector(
    ".background-container"
  );
  if (titleEl) {
    titleEl.textContent = movie.title;
  }
  if (rateEl) {
    rateEl.textContent = movie.vote_average.toFixed(1);
  }
  if (detailButtonEl) {
    detailButtonEl.disabled = false;
    detailButtonEl.onclick = () => handleMovieClick(movie.id);
  }
  if (backgroundContainerEl) {
    backgroundContainerEl.style.backgroundImage = `url(${"https://image.tmdb.org/t/p"}/w1920_and_h800_multi_faces${movie.backdrop_path})`;
  }
}
function renderMovies(movieList) {
  const list = document.querySelector(".thumbnail-list");
  if (!list) return;
  movieList.forEach((movie) => list.appendChild(createMovieItemTemplate(movie)));
}
function updateEmptyListAlert() {
  const listEl = document.querySelector(".thumbnail-list");
  if (!listEl) return;
  if (listEl.children.length === 0) {
    listEl.insertAdjacentHTML(
      "afterend",
      `
        <div class="empty-list-alert">
          <img src="${"/javascript-movie-review/"}svg/planet.svg" alt="행성이" />
          <p class="empty-list-message">검색 결과가 없습니다.</p>
        </div>
      `
    );
  } else {
    document.querySelector(".empty-list-alert")?.remove();
  }
}
let scrollObserver = null;
function setupInfiniteScroll(prevResponseList, page, callback) {
  scrollObserver?.disconnect();
  scrollObserver = null;
  const hasMore = prevResponseList.length > 0 && prevResponseList[prevResponseList.length - 1].total_pages > page;
  let sentinel = document.querySelector(".scroll-sentinel");
  if (hasMore) {
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.className = "scroll-sentinel";
      document.querySelector(".thumbnail-list")?.insertAdjacentElement("afterend", sentinel);
    }
    const throttledCallback = throttle(callback);
    scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        throttledCallback();
      }
    });
    scrollObserver.observe(sentinel);
  } else {
    sentinel?.remove();
  }
}
function renderListTitle(query) {
  const listTitleEl = document.querySelector(".list-title");
  if (listTitleEl) {
    listTitleEl.textContent = `"${query}" 검색 결과`;
  }
}
function removeSkeletonItem() {
  document.querySelectorAll(".skeleton-item").forEach((element) => element.remove());
}
function removeTopRatedMovieSkeleton() {
  document.querySelectorAll(".top-rated-movie .skeleton").forEach((element) => element.remove());
}
async function renderMoviePage({
  page,
  prevResponseList,
  fetchFn,
  beforeFetch,
  afterRender,
  extraFinally,
  showMoreCallback
}) {
  try {
    setPage(page);
    beforeFetch?.();
    renderSkeletonItems(20);
    const responseList = await fetchFn(prevResponseList.length, page);
    prevResponseList.push(...responseList);
    const movieList = responseList.reduce((arr, response) => {
      return [...arr, ...response.results];
    }, []);
    renderMovies(movieList);
    afterRender?.();
    setupInfiniteScroll(prevResponseList, page, showMoreCallback);
  } catch (error) {
    if (error instanceof Error) {
      showErrorToast({ title: error.name, message: error.message });
    }
  } finally {
    removeSkeletonItem();
    extraFinally?.();
  }
}
function closeMovieModal() {
  document.querySelector("#modalBackground")?.classList.remove("active");
  document.body.classList.remove("modal-open");
}
function showModalLoading() {
  const modalContainer = document.querySelector(".modal-container");
  if (modalContainer) {
    modalContainer.classList.add("is-loading");
    modalContainer.innerHTML = '<div class="modal-spinner"></div>';
  }
  document.querySelector("#modalBackground")?.classList.add("active");
  document.body.classList.add("modal-open");
}
function formatRatingText(rating) {
  return `${RATING_LABELS[rating] ?? ""} (${rating}/10)`;
}
function updateStarDisplay(buttons, rating) {
  buttons.forEach((btn) => {
    const value = Number(btn.dataset.value);
    const img = btn.querySelector(".star-icon");
    if (img) {
      img.src = rating !== null && value <= rating ? `${"/javascript-movie-review/"}images/star_filled.png` : `${"/javascript-movie-review/"}images/star_empty.png`;
    }
  });
}
function initStarRating(container, movieId) {
  const buttons = container.querySelectorAll(".star-btn");
  const ratingTextEl = container.querySelector(".rating-text");
  let savedRating = ratingStore.getRating(movieId);
  updateStarDisplay(buttons, savedRating);
  if (ratingTextEl) ratingTextEl.textContent = savedRating !== null ? formatRatingText(savedRating) : "";
  buttons.forEach((btn) => {
    const value = Number(btn.dataset.value);
    btn.addEventListener("mouseenter", () => {
      updateStarDisplay(buttons, value);
      if (ratingTextEl) ratingTextEl.textContent = formatRatingText(value);
    });
    btn.addEventListener("mouseleave", () => {
      updateStarDisplay(buttons, savedRating);
      if (ratingTextEl) ratingTextEl.textContent = savedRating !== null ? formatRatingText(savedRating) : "";
    });
    btn.addEventListener("click", () => {
      savedRating = value;
      ratingStore.setRating(movieId, value);
      updateStarDisplay(buttons, savedRating);
      if (ratingTextEl) ratingTextEl.textContent = formatRatingText(savedRating);
    });
  });
}
function openMovieModal(movieDetail) {
  const modalContainer = document.querySelector(".modal-container");
  if (!modalContainer) return;
  const year = movieDetail.release_date?.split("-")[0] ?? "";
  const genreText = movieDetail.genres.map((g) => g.name).join(", ");
  const starBtnsHtml = [2, 4, 6, 8, 10].map((v) => `<button class="star-btn" data-value="${v}"><img class="star-icon" src="${"/javascript-movie-review/"}images/star_empty.png" alt="${v}점" /></button>`).join("");
  modalContainer.classList.remove("is-loading");
  modalContainer.innerHTML = `
    <div class="modal-image">
      <img alt="" />
    </div>
    <div class="modal-description">
      <h2></h2>
      <p class="category"></p>
      <div class="rate-row">
        <span class="rate-label">평균</span>
        <img src="${"/javascript-movie-review/"}images/star_filled.png" class="star" />
        <span class="rate-value"></span>
      </div>
      <hr />
      <div class="rate-row my-rating">
        <span class="rate-label">내 별점</span>
        <div class="star-rating-row">
          <div class="star-rating">${starBtnsHtml}</div>
          <span class="rating-text"></span>
        </div>
      </div>
      <hr />
      <p class="detail-title">줄거리</p>
      <p class="detail"></p>
    </div>
  `;
  const imgEl = modalContainer.querySelector(".modal-image img");
  if (imgEl) {
    imgEl.src = `${"https://image.tmdb.org/t/p"}/w500${movieDetail.poster_path}`;
    imgEl.alt = movieDetail.title;
    imgEl.addEventListener("error", () => {
      imgEl.src = `${"/javascript-movie-review/"}images/default_movie_image.png`;
    }, { once: true });
  }
  const titleEl = modalContainer.querySelector("h2");
  if (titleEl) titleEl.textContent = movieDetail.title;
  const categoryEl = modalContainer.querySelector(".category");
  if (categoryEl) categoryEl.textContent = `${year} · ${genreText}`;
  const rateValueEl = modalContainer.querySelector(".rate-value");
  if (rateValueEl) rateValueEl.textContent = movieDetail.vote_average.toFixed(1);
  const detailEl = modalContainer.querySelector(".detail");
  if (detailEl) detailEl.textContent = movieDetail.overview;
  initStarRating(modalContainer, movieDetail.id);
  document.querySelector("#modalBackground")?.classList.add("active");
  document.body.classList.add("modal-open");
}
async function handleMovieClick(movieId) {
  showModalLoading();
  try {
    const movieDetail = await fetchMovieDetail(movieId);
    openMovieModal(movieDetail);
  } catch (error) {
    closeMovieModal();
    if (error instanceof Error) {
      showErrorToast({ title: error.name, message: error.message });
    }
  }
}
function initModal() {
  document.querySelector("#closeModal")?.addEventListener("click", closeMovieModal);
  document.querySelector("#modalBackground")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeMovieModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMovieModal();
  });
}
export {
  renderMoviePage as a,
  removeTopRatedMovieSkeleton as b,
  getQuery as c,
  renderListTitle as d,
  fetchSearchMoviesByPageRange as e,
  fetchPopularMoviesByPageRange as f,
  getPage as g,
  initModal as i,
  renderTopRatedMovie as r,
  setQuery as s,
  updateEmptyListAlert as u
};
