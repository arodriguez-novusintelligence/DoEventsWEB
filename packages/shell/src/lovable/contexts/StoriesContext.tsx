/**
 * Stories context — empalme Lovable sobre implementación real en `packages/shell/src/contexts/StoriesContext.tsx`.
 *
 * API expuesta (paridad Lovable):
 * - `activeAuthorIds`, `hasActiveStory(userId)`, `refreshStories`
 * - `loading`, `loadError`, `loadErrorMessage`, `isEmpty`, `authorCount`
 *
 * Datos vía `fetchNearbyStories` + `fetchUserStories` — sin mocks.
 */
export {
  StoriesProvider,
  useActiveStoryAuthors,
  useStories,
} from '../../../contexts/StoriesContext';

export type { StoriesContextValue } from '../../../contexts/StoriesContext';

/** Alias Lovable — mismo hook que `useStories`. */
export { useActiveStoryAuthors as useStoriesContext } from '../../../contexts/StoriesContext';
