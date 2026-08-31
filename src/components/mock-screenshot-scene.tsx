import { StyleSheet, Text, View } from "react-native";

import type { ScreenshotItem } from "@/contracts/domain";
import { echoContentTypeLabel } from "@/domain/content-type-presentation";
import { tokens } from "@/theme/tokens";

interface MockScreenshotSceneProps {
  item: ScreenshotItem;
}

function CommerceScene({ item }: MockScreenshotSceneProps) {
  const title = item.analysis?.title ?? "저장한 상품 화면";
  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Text style={styles.appName}>{item.source.appName ?? "SHOP"}</Text>
        <Text style={styles.appAction}>검색　장바구니</Text>
      </View>
      <View style={styles.commerceBody}>
        <View style={styles.commerceTitleRow}>
          <Text style={styles.screenTitle}>장바구니</Text>
          <Text style={styles.screenMeta}>2개</Text>
        </View>
        <View style={styles.cartRow}>
          <View style={styles.productThumb}>
            <View style={styles.productShape} />
            <View style={styles.productSole} />
          </View>
          <View style={styles.cartCopy}>
            <Text numberOfLines={2} style={styles.cartTitle}>
              {title}
            </Text>
            <View style={[styles.copyLine, styles.copyLineShort]} />
            <Text style={styles.price}>129,000원</Text>
          </View>
        </View>
        <View style={styles.recommendPanel}>
          <Text style={styles.panelLabel}>함께 본 상품</Text>
          <View style={styles.recommendRow}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.recommendCard}>
                <View style={styles.recommendImage} />
                <View style={styles.recommendLine} />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.cartButton}>
          <Text style={styles.cartButtonText}>선택한 상품 보기</Text>
        </View>
      </View>
    </View>
  );
}

function ProductScene({ item }: MockScreenshotSceneProps) {
  const title = item.analysis?.title ?? "저장한 상품";
  return (
    <View style={styles.screen}>
      <View style={styles.socialBar}>
        <View style={styles.sourceAvatar} />
        <Text style={styles.socialSource}>{item.source.appName ?? "Instagram"}</Text>
        <Text style={styles.socialMenu}>•••</Text>
      </View>
      <View style={styles.productStage}>
        <View style={styles.largeProductShape} />
        <View style={styles.largeProductSole} />
        <View style={styles.productShadow} />
      </View>
      <View style={styles.productDetails}>
        <Text numberOfLines={1} style={styles.productName}>
          {title}
        </Text>
        <Text style={styles.productPrice}>129,000원</Text>
        <View style={styles.sizeRow}>
          {["240", "250", "260", "270"].map((size) => (
            <View key={size} style={styles.sizeChip}>
              <Text style={styles.sizeText}>{size}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ArticleScene({ item }: MockScreenshotSceneProps) {
  const title = item.analysis?.title ?? "저장한 기사";
  return (
    <View style={styles.screen}>
      <View style={styles.browserBar}>
        <Text style={styles.browserControl}>‹</Text>
        <View style={styles.addressBar}>
          <Text numberOfLines={1} style={styles.addressText}>
            {item.source.domain ?? "news.example.com"}
          </Text>
        </View>
        <Text style={styles.browserControl}>⋯</Text>
      </View>
      <View style={styles.articleBody}>
        <Text style={styles.articleSection}>TECH · INSIGHT</Text>
        <Text numberOfLines={3} style={styles.articleTitle}>
          {title}
        </Text>
        <Text style={styles.articleByline}>오늘의 뉴스　8월 21일</Text>
        <View style={styles.articleHero}>
          <View style={styles.articleHeroBlock} />
          <View style={styles.articleHeroBlockSmall} />
        </View>
        <View style={styles.articleLines}>
          {[94, 100, 86, 96, 72, 91].map((width, index) => (
            <View key={index} style={[styles.articleLine, { width: `${width}%` }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function SocialScene({ item }: MockScreenshotSceneProps) {
  const title = item.analysis?.title ?? "저장한 장면";
  return (
    <View style={styles.darkScreen}>
      <View style={styles.socialOverlayTop}>
        <Text style={styles.darkSource}>{item.source.appName ?? "SOCIAL"}</Text>
        <Text style={styles.darkMeta}>추천　팔로잉</Text>
      </View>
      <View style={styles.socialSceneCore}>
        <View style={styles.quoteMark} />
        <Text numberOfLines={3} style={styles.sceneQuote}>
          {title}
        </Text>
      </View>
      <View style={styles.socialCaption}>
        <Text style={styles.darkHandle}>@saved.scene</Text>
        <Text numberOfLines={2} style={styles.darkCaption}>
          나중에 다시 보고 싶어서 캡처한 장면
        </Text>
      </View>
    </View>
  );
}

export function MockScreenshotScene({ item }: MockScreenshotSceneProps) {
  const contentType = item.contentType ?? item.analysis?.contentType ?? "other";

  if (contentType === "ui_reference") return <CommerceScene item={item} />;
  if (contentType === "product") return <ProductScene item={item} />;
  if (contentType === "article" || contentType === "document") {
    return <ArticleScene item={item} />;
  }
  if (contentType === "social_post" || contentType === "video_frame") {
    return <SocialScene item={item} />;
  }

  return (
    <View style={styles.fallbackScreen}>
      <Text style={styles.fallbackType}>{echoContentTypeLabel[contentType]}</Text>
      <Text numberOfLines={3} style={styles.fallbackTitle}>
        {item.analysis?.title ?? "저장한 화면"}
      </Text>
      <View style={styles.fallbackPanel}>
        <View style={[styles.copyLine, styles.copyLineStrong]} />
        <View style={styles.copyLine} />
        <View style={[styles.copyLine, styles.copyLineShort]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.surface },
  darkScreen: { flex: 1, backgroundColor: tokens.color.ink },
  appBar: {
    minHeight: 46,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.line,
  },
  appName: { color: tokens.color.ink, fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  appAction: { color: tokens.color.inkSecondary, fontSize: 10, fontWeight: "600" },
  commerceBody: { flex: 1, padding: tokens.space[4], gap: tokens.space[3] },
  commerceTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  screenTitle: { color: tokens.color.ink, fontSize: 20, lineHeight: 26, fontWeight: "800" },
  screenMeta: { color: tokens.color.inkSecondary, fontSize: 11, fontWeight: "600" },
  cartRow: { flexDirection: "row", gap: tokens.space[3] },
  productThumb: {
    width: 92,
    height: 82,
    position: "relative",
    overflow: "hidden",
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surfaceMuted,
  },
  productShape: {
    width: 58,
    height: 22,
    position: "absolute",
    left: 17,
    top: 29,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.ink,
    transform: [{ rotate: "-9deg" }],
  },
  productSole: {
    width: 66,
    height: 6,
    position: "absolute",
    left: 14,
    top: 52,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.lineStrong,
    transform: [{ rotate: "-4deg" }],
  },
  cartCopy: { flex: 1, justifyContent: "center", gap: tokens.space[1] },
  cartTitle: { color: tokens.color.ink, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  price: { color: tokens.color.ink, fontSize: 13, fontWeight: "800" },
  copyLine: {
    width: "88%",
    height: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.line,
  },
  copyLineShort: { width: "52%" },
  copyLineStrong: { width: "68%", height: 7, backgroundColor: tokens.color.lineStrong },
  recommendPanel: {
    flex: 1,
    padding: tokens.space[3],
    gap: tokens.space[2],
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.canvas,
  },
  panelLabel: { color: tokens.color.ink, fontSize: 12, fontWeight: "800" },
  recommendRow: { flex: 1, flexDirection: "row", gap: tokens.space[2] },
  recommendCard: { flex: 1, gap: tokens.space[1] },
  recommendImage: {
    flex: 1,
    minHeight: 42,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.surfaceMuted,
  },
  recommendLine: {
    width: "72%",
    height: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.lineStrong,
  },
  cartButton: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.ink,
  },
  cartButtonText: { color: tokens.color.surface, fontSize: 11, fontWeight: "800" },
  socialBar: {
    minHeight: 44,
    paddingHorizontal: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[2],
  },
  sourceAvatar: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: tokens.color.lineStrong,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surfaceMuted,
  },
  socialSource: { flex: 1, color: tokens.color.ink, fontSize: 11, fontWeight: "700" },
  socialMenu: { color: tokens.color.inkSecondary, fontSize: 10, letterSpacing: 1 },
  productStage: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.canvasDeep,
  },
  largeProductShape: {
    width: 184,
    height: 58,
    zIndex: 2,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.ink,
    transform: [{ rotate: "-8deg" }],
  },
  largeProductSole: {
    width: 202,
    height: 12,
    zIndex: 2,
    marginTop: -8,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.lineStrong,
    transform: [{ rotate: "-4deg" }],
  },
  productShadow: {
    width: 220,
    height: 24,
    position: "absolute",
    bottom: 28,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.line,
    opacity: 0.6,
  },
  productDetails: {
    padding: tokens.space[3],
    gap: tokens.space[1],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  productName: { color: tokens.color.ink, fontSize: 12, fontWeight: "800" },
  productPrice: { color: tokens.color.ink, fontSize: 14, fontWeight: "900" },
  sizeRow: { marginTop: tokens.space[1], flexDirection: "row", gap: tokens.space[1] },
  sizeChip: {
    minWidth: 42,
    minHeight: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
  },
  sizeText: { color: tokens.color.inkSecondary, fontSize: 9, fontWeight: "700" },
  browserBar: {
    minHeight: 44,
    paddingHorizontal: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[2],
    backgroundColor: tokens.color.canvasDeep,
  },
  browserControl: { color: tokens.color.inkSecondary, fontSize: 18, fontWeight: "700" },
  addressBar: {
    flex: 1,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surface,
  },
  addressText: {
    maxWidth: "86%",
    color: tokens.color.inkSecondary,
    fontSize: 9,
    fontWeight: "600",
  },
  articleBody: { flex: 1, padding: tokens.space[5], gap: tokens.space[3] },
  articleSection: {
    color: tokens.color.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  articleTitle: {
    color: tokens.color.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  articleByline: { color: tokens.color.inkSecondary, fontSize: 9, fontWeight: "600" },
  articleHero: {
    minHeight: 74,
    position: "relative",
    overflow: "hidden",
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.canvasDeep,
  },
  articleHeroBlock: { width: "58%", height: "100%", backgroundColor: tokens.color.ink },
  articleHeroBlockSmall: {
    width: "28%",
    height: "56%",
    position: "absolute",
    right: 18,
    top: 16,
    borderRadius: tokens.radius.thumbnail,
    backgroundColor: tokens.color.lineStrong,
  },
  articleLines: { gap: 7 },
  articleLine: { height: 5, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.line },
  socialOverlayTop: {
    minHeight: 48,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  darkSource: { color: tokens.color.surface, fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  darkMeta: { color: tokens.color.line, fontSize: 10, fontWeight: "700" },
  socialSceneCore: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space[7],
    gap: tokens.space[5],
    backgroundColor: tokens.color.ink,
  },
  quoteMark: {
    width: 36,
    height: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.signal,
  },
  sceneQuote: {
    color: tokens.color.surface,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  socialCaption: { padding: tokens.space[4], gap: tokens.space[1] },
  darkHandle: { color: tokens.color.surface, fontSize: 11, fontWeight: "800" },
  darkCaption: { color: tokens.color.line, fontSize: 11, lineHeight: 16 },
  fallbackScreen: {
    flex: 1,
    padding: tokens.space[6],
    justifyContent: "center",
    gap: tokens.space[4],
    backgroundColor: tokens.color.surface,
  },
  fallbackType: {
    color: tokens.color.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  fallbackTitle: { color: tokens.color.ink, fontSize: 23, lineHeight: 30, fontWeight: "900" },
  fallbackPanel: {
    padding: tokens.space[4],
    gap: tokens.space[2],
    borderRadius: tokens.radius.card,
    backgroundColor: tokens.color.canvasDeep,
  },
});
