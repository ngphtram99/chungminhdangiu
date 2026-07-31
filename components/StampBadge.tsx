import { PlaceStatus, STATUS_LABEL } from "@/lib/types";

const RING_COLOR: Record<PlaceStatus, string> = {
  visited: "border-sage text-sage-dark",
  want_to_go: "border-coral text-coral-dark",
  not_yet: "border-mustard text-mustard-dark",
};

export default function StampBadge({ status }: { status: PlaceStatus }) {
  return (
    <div
      className={`stamp inline-flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-dashed ${RING_COLOR[status]} shrink-0 bg-paper/60`}
      aria-hidden="true"
    >
      <span className="font-mono text-[9px] tracking-widest leading-tight text-center px-1">
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
