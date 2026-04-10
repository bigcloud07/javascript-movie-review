import { MovieListResponse } from "./type";
import { fetchPopularMoviesByPageRange, getPage, removeTopRatedMovieSkeleton, renderMoviePage, renderTopRatedMovie } from "./utils";

addEventListener("load", async () => {
  let prevResponseList: MovieListResponse[] = [];

  async function renderPopularMoviePage(page: number) {
    await renderMoviePage({
      page,
      prevResponseList,
      fetchFn: (startPage, p) => fetchPopularMoviesByPageRange(startPage, p),
      extraFinally: removeTopRatedMovieSkeleton,
      showMoreCallback: () => renderPopularMoviePage(getPage() + 1),
    });
  }

  await renderPopularMoviePage(getPage());

  if (prevResponseList.length && prevResponseList[0].results.length) {
    renderTopRatedMovie(prevResponseList[0].results[0]);
  }
});
