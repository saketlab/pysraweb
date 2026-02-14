import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  priority?: boolean;
  className?: string;
}

export default function Logo({
  width = 619,
  height = 103,
  style,
  priority = false,
  className,
}: LogoProps) {
  return (
    <span className={className} style={style}>
      <Image
        src="/logo-light.svg"
        alt="pysraweb"
        width={width}
        height={height}
        priority={priority}
        className="logo-light"
      />
      <Image
        src="/logo-dark.svg"
        alt="pysraweb"
        width={width}
        height={height}
        priority={priority}
        className="logo-dark"
      />
    </span>
  );
}
