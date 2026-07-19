import { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@lovable/components/ui/accordion";
import { LucideIcon } from "lucide-react";

interface SectionAccordionProps {
  value: string;
  icon: LucideIcon;
  title: string;
  titleHighlight?: string;
  iconColor?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const SectionAccordion = ({
  value,
  icon: Icon,
  title,
  titleHighlight,
  iconColor = "text-primary",
  children,
}: SectionAccordionProps) => {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border-0 bg-card shadow-sm"
    >
      <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-secondary/30 transition-colors sm:px-4 sm:py-4 [&[data-state=open]]:bg-secondary/20 [&>svg]:ml-2 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0 [&>svg]:text-primary">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 text-left sm:gap-3">
          <div className={`shrink-0 rounded-lg bg-primary/10 p-2 ${iconColor}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="min-w-0 break-words text-sm font-medium leading-snug text-foreground sm:text-base">
            {titleHighlight && <span className="font-semibold italic text-primary">{titleHighlight}</span>}
            {titleHighlight && title && ' '}
            {title}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-0">
        <div className="border-t border-border px-3 py-4 sm:px-4 sm:py-5">{children}</div>
      </AccordionContent>
    </AccordionItem>

  );
};

export default SectionAccordion;
