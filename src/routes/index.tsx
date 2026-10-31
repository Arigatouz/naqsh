import { createFileRoute } from "@tanstack/react-router";
import { StudioApp } from "@/components/studio/App";

export const Route = createFileRoute("/")({ component: StudioApp });
