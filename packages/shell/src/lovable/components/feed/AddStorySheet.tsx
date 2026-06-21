import {
  CreateStorySheet,
  type CreateStorySheetProps,
} from '../../../components/CreateStorySheet';

export type AddStorySheetProps = CreateStorySheetProps;

/**
 * Sheet inferior Lovable para crear historia — delega en `CreateStorySheet` con API real
 * (`createStory`, `uploadMediaFile`, transmisión en vivo vía `updateStoryLivePlayback`).
 */
export const AddStorySheet = (props: AddStorySheetProps) => <CreateStorySheet {...props} />;

export default AddStorySheet;
