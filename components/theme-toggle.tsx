import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { SegmentedControl, useThemeContext } from "@radix-ui/themes";

export default function ThemeToggle() {
  const theme = useThemeContext();

  return (
    <SegmentedControl.Root defaultValue={theme?.appearance}>
      <SegmentedControl.Item value="light">
        <SunIcon style={{ marginTop: "5px" }} />
      </SegmentedControl.Item>
      <SegmentedControl.Item style={{ marginTop: "5px" }} value="dark">
        <MoonIcon />
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  );
}
