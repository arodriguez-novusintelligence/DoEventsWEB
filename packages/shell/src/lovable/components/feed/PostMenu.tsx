import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@lovable/components/ui/dropdown-menu';
import { MoreHorizontal, EyeOff, ThumbsDown, Ban, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenuSeparator } from '@lovable/components/ui/dropdown-menu';

interface PostMenuProps {
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide: () => void;
  onNotInterested: () => void;
  onBlock: () => void;
  onReport: () => void;
}

const PostMenu = ({ isOwner, onEdit, onDelete, onHide, onNotInterested, onBlock, onReport }: PostMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full p-1.5 text-primary transition-colors hover:bg-accent">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isOwner ? (
          <>
            <DropdownMenuItem onClick={onEdit} className="gap-3">
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="gap-3 text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={onHide} className="gap-3">
              <EyeOff className="h-4 w-4" />
              Ocultar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNotInterested} className="gap-3">
              <ThumbsDown className="h-4 w-4" />
              No me interesa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBlock} className="gap-3">
              <Ban className="h-4 w-4" />
              Bloquear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onReport} className="gap-3 text-destructive focus:text-destructive">
              <AlertCircle className="h-4 w-4" />
              Denunciar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostMenu;
