/** Re-export — implementación real en `packages/shell/src/contexts/StoriesContext.tsx`.
 *
 * API expuesta (paridad Lovable): `loadError`, `loadErrorMessage`, `isEmpty`, `authorCount`,
 * `refreshStories`, `hasActiveStory`, `activeAuthorIds`, `loading`.
 * Sin mocks; datos vía `fetchNearbyStories` + `fetchUserStories`.
 */
export {
  StoriesProvider,
  useActiveStoryAuthors,
  useStories,
} from '../../../contexts/StoriesContext';
