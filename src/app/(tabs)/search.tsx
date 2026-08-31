import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";

import { AppScreen } from "@/components/app-screen";
import { ScreenHeader } from "@/components/screen-header";
import { SectionHeading } from "@/components/section-heading";
import { ScreenshotCard } from "@/components/screenshot-card";
import { StatePanel } from "@/components/state-panel";
import { TabIcon } from "@/components/tab-icon";
import type { ScreenshotItem } from "@/contracts/domain";
import { useAppData } from "@/data/app-data-provider";
import { isScreenshotSensitive } from "@/domain/sensitive-presentation";
import { intentLabel, ko } from "@/localization/ko";
import { tokens } from "@/theme/tokens";

const suggestions = ["검정 러닝화", "경쟁사 이벤트", "공유 뉴스"];

export default function SearchScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { search } = useAppData();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScreenshotItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const routedQuery = useRef<string | null>(null);

  const runSearch = useCallback(
    async (nextQuery = query) => {
      const trimmed = nextQuery.trim();
      if (!trimmed) {
        setResults([]);
        setSubmitted(false);
        return;
      }
      setSearching(true);
      setSubmitted(true);
      setSearchError(null);
      try {
        setResults(await search(trimmed));
      } catch (error) {
        setResults([]);
        setSearchError(error instanceof Error ? error.message : "검색을 완료하지 못했어요.");
      } finally {
        setSearching(false);
      }
    },
    [query, search],
  );

  const chooseSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    void runSearch(suggestion);
  };

  useEffect(() => {
    if (!q || routedQuery.current === q) return;
    routedQuery.current = q;
    setQuery(q);
    void runSearch(q);
  }, [q, runSearch]);

  const resetSearch = () => {
    setQuery("");
    setResults([]);
    setSubmitted(false);
    setSearchError(null);
  };

  const renderResult = ({ item, index }: { item: ScreenshotItem; index: number }) => {
    const intent = item.intent ?? item.analysis?.suggestedIntent ?? "keep";
    const source = item.source.appName ?? item.source.domain ?? "출처 미상";
    return (
      <View style={styles.resultCard}>
        <ScreenshotCard
          item={item}
          onPress={() => router.push(`/item/${item.id}`)}
          variant={index === 0 ? "searchResult" : "review"}
        />
        {!isScreenshotSensitive(item) ? (
          <View style={styles.evidenceBox}>
            <Text style={styles.evidence}>
              같은 단서 · {item.analysis?.keywords.slice(0, 2).join(", ") || query} · {source} ·{" "}
              {intentLabel[intent]}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <AppScreen accessibilityHidden={!isFocused} scroll={false} testID="search-screen">
      <FlatList
        contentContainerStyle={styles.listContent}
        data={submitted && !searching && !searchError ? results : []}
        ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListFooterComponent={
          submitted && results.length > 0 && !searching && !searchError ? (
            <View style={styles.finiteEnd}>
              <Text style={styles.finiteEndTitle}>검색 결과는 여기까지예요.</Text>
              <Text style={styles.finiteEndBody}>다른 단서가 떠오르면 검색어를 바꿔보세요.</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <ScreenHeader eyebrow="필요할 때 다시" showBrandGlyph={false} title="장면 찾기" />
            <View style={styles.searchIntro}>
              <Text style={styles.searchIntroTitle}>기억나는 장면이나 단어로 찾아요.</Text>
              <Text style={styles.searchIntroBody}>
                정확한 문장이 아니어도 상품, 분위기, 남긴 이유처럼 기억나는 단서를 적어보세요.
              </Text>
            </View>
            <View style={[styles.searchBox, inputFocused && styles.searchBoxFocused]}>
              <TabIcon color={tokens.color.inkSecondary} focused={inputFocused} name="search" />
              <TextInput
                accessibilityLabel="보관한 스크린샷 검색"
                autoCapitalize="none"
                onBlur={() => setInputFocused(false)}
                onChangeText={setQuery}
                onFocus={() => setInputFocused(true)}
                onSubmitEditing={() => void runSearch()}
                placeholder={ko.search.placeholder}
                placeholderTextColor={tokens.color.inkTertiary}
                returnKeyType="search"
                style={styles.input}
                value={query}
              />
              {query ? (
                <Pressable
                  accessibilityLabel="검색어 지우기"
                  accessibilityRole="button"
                  onPress={resetSearch}
                  style={styles.clear}
                >
                  <Text style={styles.clearText}>×</Text>
                </Pressable>
              ) : null}
            </View>

            {!submitted ? (
              <View style={styles.suggestionSection}>
                <SectionHeading
                  description="검색어보다 장면의 맥락을 짧게 적어보세요."
                  title="이렇게 찾아보세요"
                />
                <View style={styles.suggestions}>
                  {suggestions.map((suggestion) => (
                    <Pressable
                      accessibilityRole="button"
                      key={suggestion}
                      onPress={() => chooseSuggestion(suggestion)}
                      style={({ pressed }) => [
                        styles.suggestion,
                        pressed && styles.suggestionPressed,
                      ]}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                      <Text accessibilityElementsHidden style={styles.suggestionArrow}>
                        →
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : searching ? (
              <StatePanel
                description="제목, 화면의 글자와 남긴 이유를 함께 확인하고 있어요."
                kind="loading"
                title="찾는 중"
              />
            ) : searchError ? (
              <StatePanel
                actionLabel="다시 찾기"
                description={searchError}
                kind="error"
                onAction={() => void runSearch()}
                title="검색을 마치지 못했어요"
              />
            ) : results.length === 0 ? (
              <StatePanel
                description={ko.search.noResultBody}
                kind="empty"
                title={ko.search.noResultTitle}
              />
            ) : (
              <View style={styles.resultsHeader}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  “{query}” 결과
                </Text>
                <Text accessibilityLiveRegion="polite" style={styles.resultCount}>
                  {results.length}장
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={renderResult}
        showsVerticalScrollIndicator
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: tokens.space[12] },
  headerContent: { gap: tokens.layout.sectionGap, paddingBottom: tokens.space[4] },
  searchIntro: {
    gap: tokens.space[2],
    paddingVertical: tokens.space[2],
  },
  searchIntroTitle: { color: tokens.color.ink, fontSize: 18, lineHeight: 25, fontWeight: "800" },
  searchIntroBody: { color: tokens.color.inkSecondary, fontSize: 13, lineHeight: 20 },
  searchBox: {
    minHeight: 60,
    paddingHorizontal: tokens.space[3],
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space[2],
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  searchBoxFocused: { borderWidth: 2, borderColor: tokens.color.primary },
  input: { flex: 1, color: tokens.color.ink, fontSize: 15, lineHeight: 22 },
  clear: {
    minWidth: tokens.size.touchTarget,
    minHeight: tokens.size.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: { color: tokens.color.inkSecondary, fontSize: 22 },
  suggestionSection: { gap: tokens.space[4] },
  sectionTitle: { color: tokens.color.ink, fontSize: 20, lineHeight: 28, fontWeight: "700" },
  suggestions: { gap: tokens.space[2] },
  suggestion: {
    minHeight: 56,
    paddingHorizontal: tokens.space[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.screenshotCard,
    backgroundColor: tokens.color.surface,
  },
  suggestionPressed: { backgroundColor: tokens.color.surfaceMuted },
  suggestionText: { color: tokens.color.ink, fontSize: 15, fontWeight: "600" },
  suggestionArrow: { color: tokens.color.primary, fontSize: 18 },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  resultCount: { color: tokens.color.inkSecondary, fontSize: 13, fontVariant: ["tabular-nums"] },
  resultCard: { gap: tokens.space[2] },
  resultSeparator: { height: tokens.space[5] },
  evidenceBox: {
    marginTop: -tokens.space[1],
    paddingTop: tokens.space[3],
    borderTopWidth: 1,
    borderTopColor: tokens.color.line,
  },
  evidence: { flex: 1, color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
  finiteEnd: {
    gap: tokens.space[1],
    marginTop: tokens.space[6],
    padding: tokens.space[5],
    borderRadius: tokens.radius.screenshotCard,
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: tokens.color.surfaceMuted,
  },
  finiteEndTitle: { color: tokens.color.ink, fontSize: 14, fontWeight: "700" },
  finiteEndBody: { color: tokens.color.inkSecondary, fontSize: 12, lineHeight: 18 },
});
