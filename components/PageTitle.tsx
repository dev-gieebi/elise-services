export default function PageTitle({ icon: I, children }: { icon: React.ComponentType<any>; children: React.ReactNode }) {
  return <h2 className="page-title"><I /> {children}</h2>;
}
