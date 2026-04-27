"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ButtonHTMLAttributes } from "react";
import { useNavigationHistory } from "@/components/providers/navigation-history-provider";

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fallbackPath?: string;
  label?: string;
};

export default function BackButton({
  fallbackPath = "/dashboard",
  label = "Back",
  className,
  onClick,
  ...props
}: BackButtonProps) {
  const router = useRouter();
  const { previousPath } = useNavigationHistory();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    router.push(previousPath || fallbackPath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 ${className || ''}`}
      {...props}
    >
      <ArrowLeft size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
}
