import { ManagerNav } from "./ManagerNav";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ManagerNav />
      {children}
    </div>
  );
}
