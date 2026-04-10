import { MovieListResponse, Movie } from "./type";
import { fetchPopularMoviesByPageRange, getPage, removeSkeletonItem, renderMovies, renderShowMoreButton, renderSkeletonItems, renderTopRatedMovie, setPage } from "./utils";
import { showErrorToast } from "./toast";

addEventListener("load", async () => {
  let prevResponseList: MovieListResponse[] = [];

  async function renderPopularMoviePage(page: number) {
    try {
      setPage(page);

      renderSkeletonItems(20);

      const responseList = await fetchPopularMoviesByPageRange(
        prevResponseList.length,
        page,
      );

      removeSkeletonItem();

      prevResponseList.push(...responseList);

      const movieList = responseList.reduce((arr: Movie[], response) => {
        return [...arr, ...response.results];
      }, []);

      renderMovies(movieList);

      renderShowMoreButton(prevResponseList, page, () => {
        renderPopularMoviePage(getPage() + 1);
      });
    } catch (error) {
      if (error instanceof Error) {
        showErrorToast({ title: error.name, message: error.message });
      }
    }
  }

  await renderPopularMoviePage(getPage());

  if (prevResponseList.length && prevResponseList[0].results.length) {
    renderTopRatedMovie(prevResponseList[0].results[0]);
  }
});
