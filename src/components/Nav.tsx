import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Nav({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="nav">
      <div className="nav-in">
        <Link href="/" className="brand"><img src="/go-logo.jpg" alt="" width={28} height={28} />Central Hall</Link>
        <div className="nav-r">{right}<ThemeToggle /></div>
      </div>
    </nav>
  );
}
