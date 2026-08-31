import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useIsFocused, useRouter } from "expo-router";

import { AppScreen } from "@/components/app-screen";
import { SelectionCheckIcon } from "@/components/intent-icon";
import { IntentChip } from "@/components/intent-chip";
import { ScreenHeader } from "@/components/screen-header";
import { SectionHeading } from "@/components/section-heading";
import { ScreenshotCard } from "@/components/screenshot-card";
import { StatePanel } from "@/components/state-panel";
import type { Intent, ScreenshotItem } from "@/contracts/domain";
import { useAppData } from "@/data/app-data-provider";
import { ko } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

const intents: Intent[] = ["reference", "want", "share", "read", "keep"];

export default function LibraryScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const { items, loading } = useAppData();
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const columns = width < 360 || fontScale >= 1.6 ? 1 : width >= 900 && fontScale < 1.4 ? 3 : 2;

  const savedItems = useMemo(
    () =>
      items
        .filter((item) => item.status === "saved" || item.status === "completed")
        .filter((item) => !selectedIntent || item.intent === selectedIntent)
        .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)),
    [items, selectedIntent],
  );

  const renderItem = ({ item, index }: { item: ScreenshotItem; index: number }) => (
    <View
      style={[
        styles.gridItem,
        columns === 1 && styles.gridItemSingle,
        columns > 1 && styles.gridItemMulti,
        columns > 1 && index % columns !== columns - 1 && styles.gridItemGap,
      ]}
    >
      <ScreenshotCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
    </View>
  );

  return (
    <AppScreen
      accessibilityHidden={!isFocused}
      scroll={false}
      testID="library-screen"
      width="workspace"
    >
      <FlatList
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        data={loading ? [] : savedItems}
        key={`library-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading ? (
            <StatePanel
              description="저장한 장면을 정돈하고 있어요."
              kind="loading"
              title="보관함 준비 중"
            />
          ) : (
            <StatePanel
              description={ko.library.emptyBody}
              kind="empty"
              title={ko.library.emptyTitle}
            />
          )
        }
        ListFooterComponent={
          savedItems.length > 0 ? (
            <View style={styles.finiteEnd}>
              <Text style={styles.finiteEndTitle}>
                보관한 장면 {savedItems.length}장을 모두 봤어요.
              </Text>
              <Text style={styles.finiteEndBody}>
                기억나는 단서가 있다면 찾기에서 다시 꺼낼 수 있어요.
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <ScreenHeader
              eyebrow="나만의 캡처 아카이브"
              showBrandGlyph={false}
              title={ko.library.title}
            />
            <View style={styles.archiveSummary}>
              <View style={styles.archiveNumberBlock}>
                <View style={styles.archiveCountRow}>
                  <Text style={styles.archiveCount}>{savedItems.length}</Text>
                  <Text style={styles.archiveUnit}>장</Text>
                </View>
              </View>
              <View style={styles.archiveCopy}>
                <Text style={styles.archiveTitle}>다시 쓸 수 있는 장면</Text>
                <Text style={styles.archiveBody}>
                  {Platform.OS === "web"
                    ? "원본 파일은 그대로, 맥락만 이 브라우저에 남겨요."
                    : "원본은 사진 앱에 그대로, 맥락만 이곳에 남겨요."}
                </Text>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={styles.filters}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                accessibilityLabel={`전체 필터${!selectedIntent ? ", 선택됨" : ""}`}
                accessibilityRole="button"
                accessibilityState={{ selected: !selectedIntent }}
                onPress={() => setSelectedIntent(null)}
                style={({ pressed }) => [
                  styles.allChip,
                  !selectedIntent && styles.allChipSelected,
                  pressed && styles.allChipPressed,
                ]}
              >
                <Text style={[styles.allChipText, !selectedIntent && styles.allChipTextSelected]}>
                  {ko.library.all}
                </Text>
                {!selectedIntent ? <SelectionCheckIcon color={tokens.color.ink} /> : null}
              </Pressable>
              {intents.map((intent) => (
                <IntentChip
                  intent={intent}
                  key={intent}
                  onPress={() => setSelectedIntent(intent)}
                  selected={selectedIntent === intent}
                />
              ))}
            </ScrollView>
            {!loading && savedItems.length > 0 ? (
              <SectionHeading description="최근에 확인한 순서로 정돈했어요." title="최근 보관" />
            ) : null}
          </View>
        }
        numColumns={columns}
        renderItem={renderItem}
        showsVerticalScrollIndicator
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: tokens.space[12] },
  headerContent: { gap: tokens.layout.sectionGap, paddingBottom: tokens.space[4] },
  archiveSummary: {
    paddingVertical: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.line,
  },
  archiveNumberBlock: { minWidth: 72, alignItems: "flex-start", gap: tokens.space[2] },
  archiveCountRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  archiveCount: {
    color: tokens.color.ink,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  archiveUnit: {
    marginBottom: 5,
    color: tokens.color.inkSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  archiveCopy: { flex: 1, gap: tokens.space[1] },
  archiveTitle: { color: tokens.color.ink, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  archiveBody: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
  filters: {
    gap: tokens.space[2],
    paddingRight: tokens.space[5],
  },
  allChip: {
    minHeight: tokens.size.touchTarget,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space[1],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  allChipSelected: {
    borderColor: tokens.color.ink,
    borderWidth: 1.5,
    backgroundColor: tokens.color.surfaceMuted,
  },
  allChipPressed: { opacity: 0.74 },
  allChipText: { color: tokens.color.ink, fontSize: 12, fontWeight: "700", lineHeight: 20 },
  allChipTextSelected: { color: tokens.color.ink },
  row: { alignItems: "stretch" },
  gridItem: { flex: 1, marginBottom: tokens.layout.cardGap },
  gridItemSingle: { width: "100%" },
  gridItemMulti: { maxWidth: "100%" },
  gridItemGap: { marginRight: tokens.layout.cardGap },
  finiteEnd: {
    gap: tokens.space[1],
    marginTop: tokens.space[5],
    padding: tokens.space[5],
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: tokens.color.surfaceMuted,
  },
  finiteEndTitle: { color: tokens.color.ink, fontSize: 14, fontWeight: "700" },
  finiteEndBody: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
});
