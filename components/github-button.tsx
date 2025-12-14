import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";

export default function GitHubButton() {
  return (
    <Button variant="outline" asChild>
      <a href="https://github.com/saketkc/pysradb">
        <GitHubLogoIcon /> Star on GitHub
      </a>
    </Button>
  );
}
