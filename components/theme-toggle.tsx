import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { SegmentedControl } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // See here: https://www.npmjs.com/package/next-themes#avoid-hydration-mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SegmentedControl.Root defaultValue={theme}>
      <SegmentedControl.Item onClick={() => setTheme("light")} value="light">
        <SunIcon style={{ marginTop: "5px" }} />
      </SegmentedControl.Item>
      <SegmentedControl.Item
        onClick={() => setTheme("dark")}
        style={{ marginTop: "5px" }}
        value="dark"
      >
        <MoonIcon />
      </SegmentedControl.Item>
    </SegmentedControl.Root>
  );
}
