import SwiftUI

struct ReviewSessionView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: CaptureStore
    @State private var queueIDs: [UUID] = []
    @State private var currentIndex = 0
    @State private var reviewedCount = 0

    private var currentItem: CatchItem? {
        guard currentIndex < queueIDs.count else { return nil }
        return store.item(with: queueIDs[currentIndex])
    }

    var body: some View {
        ZStack {
            CatchTheme.ink.ignoresSafeArea()
            if let item = currentItem {
                review(item)
            } else {
                completion
            }
        }
        .onAppear {
            if queueIDs.isEmpty {
                queueIDs = store.reviewQueue.map(\.id)
            }
        }
    }

    private func review(_ item: CatchItem) -> some View {
        VStack(spacing: 16) {
            HStack {
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .black))
                        .frame(width: 44, height: 44)
                        .background(.white.opacity(0.1), in: Circle())
                }
                .accessibilityLabel("리뷰 닫기")
                Spacer()
                Text("\(min(currentIndex + 1, queueIDs.count)) / \(queueIDs.count)")
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                Spacer()
                Image(systemName: "lock.fill")
                    .font(.system(size: 13, weight: .bold))
                    .frame(width: 44, height: 44)
                    .foregroundStyle(CatchTheme.acid)
                    .accessibilityLabel("온디바이스 처리")
            }
            .foregroundStyle(.white)

            ProgressView(value: Double(currentIndex), total: Double(max(queueIDs.count, 1)))
                .tint(CatchTheme.acid)

            ScreenshotVisual(item: item)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 22))
                .overlay(RoundedRectangle(cornerRadius: 22).stroke(.white.opacity(0.14)))

            VStack(alignment: .leading, spacing: 5) {
                HStack {
                    Label(item.category.title, systemImage: item.category.symbol)
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundStyle(item.category.color)
                    if item.isSample {
                        Text("SAMPLE")
                            .font(.system(size: 9, weight: .black, design: .monospaced))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(.white.opacity(0.12), in: Capsule())
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                Text(item.title)
                    .font(.system(size: 21, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                Text(item.summary)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.white.opacity(0.55))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text("어디로 보낼까요?")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white.opacity(0.55))
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 8) {
                ForEach(CaptureCategory.allCases) { category in
                    Button {
                        choose(category, for: item)
                    } label: {
                        VStack(spacing: 5) {
                            Image(systemName: category.symbol)
                                .font(.system(size: 16, weight: .bold))
                            Text(category.title)
                                .font(.system(size: 10, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 58)
                        .background(
                            item.category == category ? category.color : Color.white.opacity(0.09),
                            in: RoundedRectangle(cornerRadius: 14)
                        )
                        .foregroundStyle(.white)
                    }
                    .accessibilityLabel("\(category.title)로 정리")
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
    }

    private var completion: some View {
        VStack(spacing: 24) {
            Spacer()
            ZStack {
                Circle()
                    .fill(CatchTheme.acid)
                    .frame(width: 112, height: 112)
                Image(systemName: "checkmark")
                    .font(.system(size: 48, weight: .black))
                    .foregroundStyle(CatchTheme.ink)
            }
            VStack(spacing: 8) {
                Text("오늘 정리, 끝!")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                Text("\(reviewedCount)장을 쓸모 있는 네 개의 맥락으로 보냈어요.")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(.white.opacity(0.6))
            }
            .foregroundStyle(.white)

            HStack(spacing: 8) {
                ForEach(CaptureCategory.allCases) { category in
                    VStack(spacing: 6) {
                        Image(systemName: category.symbol)
                            .foregroundStyle(category.color)
                        Text("\(store.count(for: category))")
                            .font(.system(size: 18, weight: .black, design: .monospaced))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 15))
                }
            }

            Spacer()
            Button("완료") { dismiss() }
                .font(.system(size: 17, weight: .black, design: .rounded))
                .foregroundStyle(CatchTheme.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(CatchTheme.acid, in: RoundedRectangle(cornerRadius: 16))
        }
        .padding(22)
    }

    private func choose(_ category: CaptureCategory, for item: CatchItem) {
        let intent: CaptureIntent = switch category {
        case .work: .reference
        case .shopping: .want
        case .social: .share
        case .news: .readLater
        }
        store.markReviewed(item.id, category: category, intent: intent)
        reviewedCount += 1
        withAnimation(.snappy(duration: 0.28)) {
            currentIndex += 1
        }
    }
}

