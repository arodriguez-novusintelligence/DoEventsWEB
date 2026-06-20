/** Re-export — implementación real en `packages/shell/src/contexts/StoriesContext.tsx`.
 *
 * API expuesta (paridad Lovable): `loadError`, `loadErrorMessage`, `isEmpty`, `authorCount`,
 * `refreshStories`, `hasActiveStory`, `activeAuthorIds`.
 */
export {
  StoriesProvider,
  useActiveStoryAuthors,
} from '../../../contexts/StoriesContext';
