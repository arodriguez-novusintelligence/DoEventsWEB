import {
  CreateStorySheet,
  type CreateStorySheetProps,
} from '../../../components/CreateStorySheet';

export interface AddStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: CreateStorySheetProps['onCreated'];
}

/**
 * Sheet inferior Lovable para crear historia — adapta props Lovable (`onOpenChange`)
 * y delega en `CreateStorySheet` con API real.
 */
export const AddStorySheet = ({ open, onOpenChange, onCreated }: AddStorySheetProps) => (
  <CreateStorySheet
    open={open}
    onClose={() => onOpenChange(false)}
    onCreated={onCreated}
  />
);

export default AddStorySheet;
