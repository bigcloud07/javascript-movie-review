import { i as initModal, c as getQuery, g as getPage, r as renderTopRatedMovie, a as renderMoviePage, u as updateEmptyListAlert, s as setQuery, d as renderListTitle, e as fetchSearchMoviesByPageRange } from "./render-B0MAVuRz.js";
addEventListener("load", async () => {
  initModal();
  let prevResponseList = [];
  async function renderSearchMoviePage(page, query) {
    await renderMoviePage({
      page,
      prevResponseList,
      fetchFn: (startPage, p) => fetchSearchMoviesByPageRange(startPage, p, query),
      beforeFetch: () => {
        setQuery(query);
        renderListTitle(query);
      },
      afterRender: updateEmptyListAlert,
      showMoreCallback: () => renderSearchMoviePage(getPage() + 1, getQuery())
    });
  }
  const searchInput = document.querySelector(".search-input");
  if (searchInput) searchInput.value = getQuery();
  await renderSearchMoviePage(getPage(), getQuery());
  if (prevResponseList.length && prevResponseList[0].results.length) {
    renderTopRatedMovie(prevResponseList[0].results[0]);
  }
});
