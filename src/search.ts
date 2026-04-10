import { showErrorToast } from "./toast";
import { MovieListResponse, Movie } from "./type";
import { fetchSearchMoviesByPageRange, getPage, getQuery, removeSkeletonItem, renderListTitle, renderMovies, renderShowMoreButton, renderSkeletonItems, renderTopRatedMovie, setPage, setQuery, updateEmptyListAlert } from "./utils";

addEventListener("load", async () => {
  let prevResponseList: MovieListResponse[] = [];

  async function renderSearchMoviePage(page: number, query: string) {
    try {
      setPage(page);
      setQuery(query);

      renderListTitle(query);

      renderSkeletonItems(20);

      const responseList = await fetchSearchMoviesByPageRange(
        prevResponseList.length,
        page,
        query
      );

      prevResponseList.push(...responseList);

      const movieList = responseList.reduce((arr: Movie[], response) => {
        return [...arr, ...response.results];
      }, []);

      renderMovies(movieList);
      updateEmptyListAlert();

      renderShowMoreButton(prevResponseList, page, () => {
        renderSearchMoviePage(getPage() + 1, getQuery());
      });
    } catch (error) {
      if (error instanceof Error) {
        showErrorToast({ title: error.name, message: error.message });
      }
    } finally {
      removeSkeletonItem();
    }
  }

  const searchInput = document.querySelector<HTMLInputElement>(".search-input");
  if (searchInput) searchInput.value = getQuery();

  await renderSearchMoviePage(getPage(), getQuery());

  if (prevResponseList.length && prevResponseList[0].results.length) {
    renderTopRatedMovie(prevResponseList[0].results[0]);
  }
});
