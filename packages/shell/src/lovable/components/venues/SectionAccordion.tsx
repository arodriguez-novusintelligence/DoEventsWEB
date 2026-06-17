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
      className="border-0 rounded-2xl bg-card shadow-sm overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-secondary/30 transition-colors [&[data-state=open]]:bg-secondary/20 [&>svg]:text-primary [&>svg]:w-5 [&>svg]:h-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-primary/10 ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-base text-foreground font-medium text-left">
            {titleHighlight && <span className="text-primary font-semibold italic">{titleHighlight}</span>}
            {titleHighlight && title && " "}
            {title}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-0">
        <div className="border-t border-border">{children}</div>
      </AccordionContent>
    </AccordionItem>

  );
};

export default SectionAccordion;
