/**
 * The app's component kit.
 *
 * Built before the screens, deliberately. The alternative — building thirteen
 * screens from ad-hoc utilities and extracting components afterwards — produces
 * thirteen slightly different products and a week of reconciliation, and it is
 * exactly how the previous version ended up with a decorative `<span>` where a
 * button belonged.
 */

export { PageHeader } from "./PageHeader";
export { Panel } from "./Panel";
export { Field, Input } from "./Field";
export { Select } from "./Select";
export { Checkbox } from "./Checkbox";
export { Textarea } from "./Textarea";
export { controlClasses } from "./control";
export { Button, buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";
export { SubmitButton } from "./SubmitButton";
export { StatusChip, type ChipTone } from "./StatusChip";
export { Verdict } from "./Verdict";
export { Callout } from "./Callout";
export { EmptyState } from "./EmptyState";
export { ContrastBadge } from "./ContrastBadge";
export { ColorField } from "./ColorField";
export { ColorPicker, type ColorPickerProps } from "./ColorPicker";
export { Ramp } from "./Ramp";
export { CopyButton } from "./CopyButton";
export { DownloadButton } from "./DownloadButton";
export { DataTable, type Column } from "./DataTable";
export { SortHeader, TableSearch, tableQuery, type TableQuery } from "./TableTools";
export { AxisGroup, Toolbar } from "./Toolbar";
export { Preview } from "./Preview";
export { PageHeaderSkeleton, Skeleton, TableSkeleton } from "./Skeleton";
export { ToastProvider, useToast, type ToastTone } from "./Toast";
