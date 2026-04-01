import { MovieListResponse, Movie } from "./type";
import { fetchMoviesByPageRange, getPage, removeSkeletonItem, renderMovies, renderShowMoreButton, renderSkeletonItems, renderTopRatedMovie, setPage } from "./utils";

addEventListener("load", async () => {
  let prevResponseList: MovieListResponse[] = [];

  try {
    async function renderMoviePage(page: number) {
      setPage(page);

      renderSkeletonItems(20);

      const responseList = await fetchMoviesByPageRange(
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
        renderMoviePage(getPage() + 1);
      })
    }

    await renderMoviePage(getPage());

    if (prevResponseList.length && prevResponseList[0].results.length) {
      renderTopRatedMovie(prevResponseList[0].results[0])
    }
  } catch (error) {
    alert(error);
  }

});
