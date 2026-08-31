export type Intent = "reference" | "want" | "share" | "read" | "keep";

export type ContentType =
  | "product"
  | "article"
  | "ui_reference"
  | "social_post"
  | "conversation"
  | "place"
  | "event"
  | "video_frame"
  | "document"
  | "other";

export type ScreenshotStatus =
  | "new"
  | "processing"
  | "ready_for_review"
  | "saved"
  | "snoozed"
  | "completed"
  | "removed"
  | "deleted_from_device";

export type GroupType = "duplicate" | "same_entity" | "scroll_sequence" | "same_topic" | "manual";

export interface SourceInfo {
  appName?: string;
  bundleId?: string;
  domain?: string;
  iconUri?: string;
}

export interface SensitiveRegion {
  id: string;
  kind:
    | "financial"
    | "address"
    | "phone"
    | "email"
    | "otp"
    | "conversation"
    | "barcode"
    | "identity"
    | "work_confidential"
    | "other";
  normalizedRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  blurredByDefault: boolean;
}

export interface ScreenshotAnalysis {
  title: string;
  summary?: string;
  summaryEvidence?: SummaryEvidence;
  ocrText?: string;
  suggestedIntent: Intent;
  intentConfidence: number;
  needsReview: boolean;
  contentType: ContentType;
  contentTypeConfidence: number;
  keywords: string[];
  extractedEntities?: {
    type: "brand" | "product" | "place" | "person" | "price" | "date" | "other";
    value: string;
  }[];
  sensitive: boolean;
  sensitiveRegions: SensitiveRegion[];
  analyzerVersion: string;
  analyzedAt: string;
}

export type SummaryBasis = "ocr_text" | "visual_embedding";

/**
 * A short, user-verifiable explanation of a generated summary.
 * This is evidence from the capture, not a model's hidden chain of thought.
 */
export interface SummaryEvidence {
  basis: SummaryBasis;
  signals: string[];
  explanation: string;
  modelVersion: string;
}

export interface ScreenshotItem {
  id: string;
  imageUri: string;
  thumbnailUri?: string;
  width: number;
  height: number;
  capturedAt: string;
  importedAt: string;
  source: SourceInfo;
  status: ScreenshotStatus;
  intent?: Intent;
  contentType?: ContentType;
  analysis?: ScreenshotAnalysis;
  groupIds: string[];
  collectionIds: string[];
  isLongCapture: boolean;
  isSensitive: boolean;
  isFavorite?: boolean;
  completedAt?: string;
  removedAt?: string;
  deletedFromDeviceAt?: string;
  deviceAssetId?: string;
}

export interface ScreenshotGroup {
  id: string;
  type: GroupType;
  itemIds: string[];
  representativeItemId: string;
  suggestedIntent: Intent;
  reviewIntent?: Intent;
  approvedIntent?: Intent;
  title: string;
  summary?: string;
  reason?: string;
  confidence: number;
  createdAt: string;
  approvedAt?: string;
  resolutionMode?: "batch" | "individual";
  splitFromGroupId?: string;
  supersededAt?: string;
  supersededByGroupIds?: string[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  itemIds: string[];
  coverItemId?: string;
  isSensitive: boolean;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReviewSession {
  id: string;
  reviewDate: string;
  initialGroupIds: string[];
  initialItemIds: string[];
  groupIds: string[];
  currentGroupIndex: number;
  revision: number;
  startedAt: string;
  completedAt?: string;
  reviewedItemCount: number;
  correctedItemCount: number;
  removedItemCount: number;
}

export interface ReviewItemDecision {
  id: string;
  sessionId: string;
  groupId: string;
  itemId: string;
  outcome: "saved" | "removed";
  intent?: Intent;
  baselineIntent?: Intent;
  createdAt: string;
  updatedAt: string;
  committedAt?: string;
}

export type DeviceDeletionRequestState = "pending" | "failed" | "succeeded" | "legacy_unverified";

export interface DeviceDeletionRequest {
  id: string;
  itemId: string;
  deviceAssetId: string;
  previousStatus: Extract<ScreenshotStatus, "saved" | "completed" | "removed">;
  state: DeviceDeletionRequestState;
  requestedAt: string;
  completedAt?: string;
  errorCode?: string;
}

export type RecallReasonCode =
  "same_entity" | "same_keywords" | "same_source_pattern" | "unfinished_intent";

export type RecallInteractionType =
  "shown" | "opened" | "acted" | "snoozed" | "dismissed" | "completed" | "expired" | "restored";

/**
 * Append-only local evidence of how a person responded to a resurfaced capture.
 * Merely scrolling past a card is not a negative signal.
 */
export interface RecallInteraction {
  id: string;
  itemId: string;
  type: RecallInteractionType;
  occurredAt: string;
  snoozedUntil?: string;
}

export interface RecallEvidence {
  sharedEntity?: string;
  sharedKeyword?: string;
  sourceName?: string;
}

export interface RecallCandidate {
  id: string;
  itemId: string;
  anchorItemId?: string;
  reasonCode: RecallReasonCode;
  evidence: RecallEvidence;
  /** Internal ranking value. Never render this number in the UI. */
  score: number;
  policyVersion: string;
  generatedAt: string;
  expiresAt: string;
}

/** A stable, finite order for one local calendar day. */
export interface DailyRecallSnapshot {
  id: string;
  recallDate: string;
  candidates: RecallCandidate[];
  generatedAt: string;
  policyVersion: string;
}

export type ActionDraftType =
  "product_decision" | "reference_board" | "article_brief" | "share_pack";

export interface ThirdSignalSuggestion {
  id: string;
  groupId: string;
  artifactType: ActionDraftType;
  intent: Exclude<Intent, "keep">;
  itemIds: string[];
  triggerItemId: string;
  subject: string;
  reasonCode: "approved_group";
  policyVersion: string;
  generatedAt: string;
}

export interface ActionDraftInteraction {
  id: string;
  suggestionId: string;
  type: "shown" | "accepted" | "dismissed";
  occurredAt: string;
}

export interface UserCorrection {
  id: string;
  itemId: string;
  field: "intent" | "content_type" | "title" | "sensitive" | "group";
  previousValue?: string;
  nextValue?: string;
  source: "review" | "detail" | "bulk_action";
  createdAt: string;
}

export interface AnalyzeScreenshotInput {
  id: string;
  imageUri: string;
  capturedAt: string;
  source?: SourceInfo;
  ocrText?: string;
}

export interface ScreenshotAnalyzer {
  analyze(input: AnalyzeScreenshotInput): Promise<ScreenshotAnalysis>;
}

export interface ShareArtifact {
  id: string;
  type: "single_discovery" | "daily_three" | "weekly_taste_board" | "collection";
  itemIds: string[];
  title?: string;
  generatedImageUri?: string;
  sensitiveCheckCompleted: boolean;
  createdAt: string;
}
