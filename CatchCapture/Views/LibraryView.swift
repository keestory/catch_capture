import SwiftUI

struct LibraryView: View {
    @EnvironmentObject private var store: CaptureStore
    @State private var selectedCategory: CaptureCategory?

    private var filteredItems: [CatchItem] {
        store.items
            .filter { item in
                selectedCategory == nil || item.category == selectedCategory
            }
            .filter { item in
                let query = store.searchText.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !query.isEmpty else { return true }
                return item.title.localizedCaseInsensitiveContains(query)
                    || item.summary.localizedCaseInsensitiveContains(query)
                    || item.recognizedText.localizedCaseInsensitiveContains(query)
                    || item.category.title.localizedCaseInsensitiveContains(query)
            }
            .sorted { $0.capturedAt > $1.capturedAt }
    }

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                LazyVStack(spacing: 12) {
                    header
                    filters
                    if filteredItems.isEmpty {
                        emptyState
                    } else {
                        ForEach(filteredItems) { item in
                            NavigationLink {
                                ItemDetailView(itemID: item.id)
                            } label: {
                                LibraryRow(item: item)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .padding(.bottom, 30)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .searchable(text: $store.searchText, prompt: "상품, 문장, 키워드 검색")
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                CatchWordmark()
                Spacer()
                Text("LIBRARY / \(store.items.count)")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(CatchTheme.mutedInk)
            }
            Text("잡아둔 모든 것")
                .font(.system(size: 32, weight: .black, design: .rounded))
                .tracking(-1.2)
        }
    }

    private var filters: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(title: "전체", symbol: "square.grid.2x2", selected: selectedCategory == nil) {
                    selectedCategory = nil
                }
                ForEach(CaptureCategory.allCases) { category in
                    FilterChip(title: category.title, symbol: category.symbol, selected: selectedCategory == category) {
                        selectedCategory = category
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "viewfinder.circle")
                .font(.system(size: 44, weight: .light))
            Text("찾는 캡처가 없어요")
                .font(.system(size: 17, weight: .bold))
            Text("검색어나 필터를 바꿔 보세요.")
                .font(.system(size: 13))
                .foregroundStyle(CatchTheme.mutedInk)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 70)
    }
}

private struct FilterChip: View {
    let title: String
    let symbol: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: symbol)
                .font(.system(size: 12, weight: .bold))
                .padding(.horizontal, 13)
                .frame(height: 40)
                .background(selected ? CatchTheme.ink : Color.white.opacity(0.65), in: Capsule())
                .foregroundStyle(selected ? CatchTheme.paper : CatchTheme.ink)
                .overlay(Capsule().stroke(CatchTheme.line))
        }
    }
}

private struct LibraryRow: View {
    let item: CatchItem

    var body: some View {
        HStack(spacing: 14) {
            ScreenshotMiniature(item: item)
                .frame(width: 62, height: 78)
            VStack(alignment: .leading, spacing: 7) {
                HStack(spacing: 6) {
                    Label(item.category.title, systemImage: item.category.symbol)
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundStyle(item.category.color)
                    if !item.isReviewed {
                        Text("확인 필요")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(CatchTheme.coral)
                    }
                }
                Text(item.title)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(CatchTheme.ink)
                    .lineLimit(1)
                Text(item.summary)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(CatchTheme.mutedInk)
                    .lineLimit(1)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(CatchTheme.mutedInk)
        }
        .padding(12)
        .background(.white.opacity(0.62), in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(CatchTheme.line))
    }
}

