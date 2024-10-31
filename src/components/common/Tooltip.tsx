//Purpose:Provides additional information when users hover over or focus on an element.
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
}
