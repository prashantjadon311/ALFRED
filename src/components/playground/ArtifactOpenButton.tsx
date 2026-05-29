"use client";

import { Rows3 } from "lucide-react";
import { Button } from "@/components/shared/Button";

export function ArtifactOpenButton({ onClick }: { onClick: () => void }) {
  return (
    <Button className="mt-4" size="sm" variant="secondary" icon={<Rows3 className="h-4 w-4" />} onClick={onClick}>
      Open artifact
    </Button>
  );
}
