export default function LoadingBar() {
  return (
    <div className="h-0.5 w-full overflow-hidden bg-elevated">
      <div className="h-full w-1/3 animate-loading-bar rounded-full bg-indigo-600" />
    </div>
  );
}
