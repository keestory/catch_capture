import copy from "../../design/copy-ko.json";
import type { Intent } from "@/contracts/domain";

export const ko = copy;

export const intentLabel: Record<Intent, string> = copy.intent;

export const intentDestinationLabel: Record<Intent, string> = {
  reference: "참고로",
  want: "사고 싶음으로",
  share: "공유로",
  read: "읽기로",
  keep: "간직으로",
};

export function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}
