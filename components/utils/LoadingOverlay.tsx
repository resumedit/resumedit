import LoadingSpinner from "@/components/utils/Loading";

function LoadingOverlay() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default LoadingOverlay;
