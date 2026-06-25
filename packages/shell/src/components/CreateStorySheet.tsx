import { AddStorySheet, type AddStorySheetProps } from '../lovable/components/feed/AddStorySheet';

export interface CreateStorySheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: AddStorySheetProps['onCreated'];
}

/** Bridge — delega en `AddStorySheet` (UI Lovable + API real). */
export const CreateStorySheet = ({ open, onClose, onCreated }: CreateStorySheetProps) => (
  <AddStorySheet
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
    onCreated={onCreated}
  />
);

export default CreateStorySheet;
