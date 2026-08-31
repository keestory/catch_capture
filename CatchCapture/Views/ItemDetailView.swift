import SwiftUI

struct ItemDetailView: View {
    @EnvironmentObject private var store: CaptureStore
    @Environment(\.dismiss) private var dismiss
    let itemID: UUID

    private var item: CatchItem? { store.item(with: itemID) }

    var body: some View {
        ZStack {
            PaperBackground()
            if let item {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        ScreenshotVisual(item: item)
                            .frame(height: 420)
                            .clipShape(RoundedRectangle(cornerRadius: 24))
                            .overlay(RoundedRectangle(cornerRadius: 24).stroke(CatchTheme.line))

                        Label(item.category.title, systemImage: item.category.symbol)
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(item.category.color)
                        Text(item.title)
                            .font(.system(size: 28, weight: .black, design: .rounded))
                        Text(item.summary)
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(CatchTheme.mutedInk)

                        SectionLabel(index: "01", title: "맥락 바꾸기")
                        HStack(spacing: 8) {
                            ForEach(CaptureCategory.allCases) { category in
                                Button {
                                    store.updateCategory(item.id, category: category)
                                } label: {
                                    Image(systemName: category.symbol)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 48)
                                        .background(
                                            item.category == category ? category.color : Color.white.opacity(0.6),
                                            in: RoundedRectangle(cornerRadius: 13)
                                        )
                                        .foregroundStyle(item.category == category ? .white : CatchTheme.ink)
                                }
                                .accessibilityLabel("\(category.title)로 변경")
                            }
                        }

                        Button(role: .destructive) {
                            store.deleteMetadata(item.id)
                            dismiss()
                        } label: {
                            Label("Catch에서만 지우기", systemImage: "trash")
                                .font(.system(size: 14, weight: .bold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                        }
                        .buttonStyle(.bordered)
                        Text("원본 사진은 삭제되지 않아요.")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(CatchTheme.mutedInk)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .padding(20)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

