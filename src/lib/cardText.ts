/*
 * Typography shared by the small (1x1) weather cards. Sizes use cqw (1% of the
 * width of the card content, see the `@container` on the card body), so text,
 * spacing and controls scale together when the card gets bigger (mobile).
 * Baseline: a 144px card (122px of content) gets 28px values and 12px text.
 */
export const CARD_VALUE = "text-[clamp(24px,23cqw,52px)] leading-none";
export const CARD_CAPTION = "text-[clamp(13px,11.5cqw,19px)] leading-tight";
export const CARD_LABEL = "text-[clamp(12px,9.8cqw,18px)] leading-tight";
export const CARD_TEXT = "text-[clamp(11px,9.6cqw,17px)] leading-tight";
export const CARD_SMALL = "text-[clamp(10px,9cqw,15px)] leading-tight";
// Wide (2x1) cards: baseline is a 304px card (282px of content) with 20px values and 12px text.
export const WIDE_VALUE = "text-[clamp(20px,7.1cqw,44px)] leading-tight";
export const WIDE_TEXT = "text-[clamp(12px,4.3cqw,24px)] leading-tight";