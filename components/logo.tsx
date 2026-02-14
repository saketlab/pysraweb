import Image from "next/image";

interface LogoProps {
  style?: React.CSSProperties;
  priority?: boolean;
  className?: string;
}

export default function Logo({
  style,
  priority = false,
  className,
}: LogoProps) {
  return (
    <span className={className} style={{ display: "block", position: "relative", overflow: "visible", ...style }}>
      <Image
        src="/logo-light.svg"
        alt="pysraweb"
        width={619}
        height={103}
        priority={priority}
        className="logo-light"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      <Image
        src="/logo-dark.svg"
        alt="pysraweb"
        width={619}
        height={103}
        priority={priority}
        className="logo-dark"
        style={{ width: "100%", height: "auto", position: "absolute", top: 0, left: 0 }}
      />
    </span>
  );
}
