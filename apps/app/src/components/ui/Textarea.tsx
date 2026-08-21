import { cn } from "@/lib/utils";
import { controlClasses } from "./control";

/**
 * A multi-line field, matching `Input` because it is the same field.
 *
 * The import screen had its own border, padding and radius, which meant the one
 * textarea in the product was visibly not part of the product.
 *
 * `resize-y` rather than the browser default `both`: horizontal resizing lets a
 * reader drag a field wider than its container and break the layout, and there
 * is never a reason to want that here.
 */
export function Textarea({
  className,
  invalid,
  mono,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  mono?: boolean;
}) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || props["aria-invalid"]}
      className={cn(controlClasses({ invalid, mono }), "resize-y leading-relaxed", className)}
    />
  );
}
