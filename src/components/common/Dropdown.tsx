//Purpose:Reusable dropdown menu for actions, navigation, or selecting options.
interface DropdownProps {
  options: Array<{ label: string; value: any }>;
  onSelect: (value: any) => void;
  trigger: React.ReactNode;
  disabled?: boolean;
}
