import { PERFORMANCE_STANDARDS_FALLBACK } from "../client/src/lib/constants";

console.log("Checking icon names in PERFORMANCE_STANDARDS_FALLBACK:");
PERFORMANCE_STANDARDS_FALLBACK.forEach((s: any) => {
    const icon = s.icon as any;
    console.log(`ID ${s.id}: ${s.title} -> Name: ${icon.name}, DisplayName: ${icon.displayName}`);
});
