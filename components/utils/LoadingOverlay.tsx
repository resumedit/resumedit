import LoadingSpinner from "@/components/utils/Loading";

function LoadingOverlay() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default LoadingOverlay;
