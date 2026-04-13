import { i as initModal, g as getPage, r as renderTopRatedMovie, a as renderMoviePage, b as removeTopRatedMovieSkeleton, f as fetchPopularMoviesByPageRange } from "./render-B0MAVuRz.js";
addEventListener("load", async () => {
  initModal();
  let prevResponseList = [];
  async function renderPopularMoviePage(page) {
    await renderMoviePage({
      page,
      prevResponseList,
      fetchFn: (startPage, p) => fetchPopularMoviesByPageRange(startPage, p),
      extraFinally: removeTopRatedMovieSkeleton,
      showMoreCallback: () => renderPopularMoviePage(getPage() + 1)
    });
  }
  await renderPopularMoviePage(getPage());
  if (prevResponseList.length && prevResponseList[0].results.length) {
    renderTopRatedMovie(prevResponseList[0].results[0]);
  }
});
