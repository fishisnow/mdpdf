import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ progress }: { progress: number }) {
  return <Progress value={progress} />;
}
