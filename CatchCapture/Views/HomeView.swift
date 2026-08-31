import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: CaptureStore
    @State private var isReviewPresented = false

    private var dateText: String {
        Date.now.formatted(.dateTime.month(.wide).day().weekday(.wide).locale(Locale(identifier: "ko_KR")))
    }

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: 24) {
                    header
                    dailyInbox
                    categorySummary
                    importPanel
                    privacyNote
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                .padding(.bottom, 30)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .fullScreenCover(isPresented: $isReviewPresented) {
            ReviewSessionView()
                .environmentObject(store)
        }
        .alert("Catch", isPresented: Binding(
            get: { store.importMessage != nil },
            set: { if !$0 { store.importMessage = nil } }
        )) {
            Button("확인", role: .cancel) { store.importMessage = nil }
        } message: {
            Text(store.importMessage ?? "")
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            CatchWordmark()
            Spacer()
            VStack(alignment: .trailing, spacing: 1) {
                Text("TODAY")
                    .font(.system(size: 10, weight: .black, design: .monospaced))
                    .tracking(1.2)
                Text(dateText)
                    .font(.system(size: 12, weight: .semibold))
            }
            .foregroundStyle(CatchTheme.mutedInk)
        }
    }

    private var dailyInbox: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(CatchTheme.acid)
                            .frame(width: 8, height: 8)
                        Text(store.isShowingSamples ? "미리보기 인박스" : "오늘의 인박스")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .textCase(.uppercase)
                    }
                    Text("오늘 잡아둔 것들,\n지금 가볍게 비워요.")
                        .font(.system(size: 31, weight: .black, design: .rounded))
                        .tracking(-1.2)
                        .lineSpacing(-2)
                    Text("AI가 먼저 나눴어요. 맞는지만 확인하면 끝.")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white.opacity(0.68))
                }
                Spacer(minLength: 2)
                ZStack {
                    ForEach(Array(store.reviewQueue.prefix(3).enumerated()), id: \.element.id) { index, item in
                        ScreenshotMiniature(item: item)
                            .frame(width: 76, height: 104)
                            .rotationEffect(.degrees(Double(index - 1) * 7))
                            .offset(x: CGFloat(index - 1) * 11, y: CGFloat(index) * 4)
                    }
                }
                .frame(width: 96, height: 124)
                .accessibilityHidden(true)
            }

            Divider()
                .overlay(.white.opacity(0.2))
                .padding(.vertical, 18)

            Button {
                isReviewPresented = true
            } label: {
                HStack {
                    Text("\(store.reviewQueue.count)장 정리 시작")
                        .font(.system(size: 17, weight: .black, design: .rounded))
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 16, weight: .black))
                }
                .foregroundStyle(CatchTheme.ink)
                .padding(.horizontal, 18)
                .frame(height: 56)
                .background(CatchTheme.acid, in: RoundedRectangle(cornerRadius: 16))
            }
            .disabled(store.reviewQueue.isEmpty)
            .opacity(store.reviewQueue.isEmpty ? 0.45 : 1)
            .accessibilityHint("오늘의 미정리 스크린샷 리뷰를 시작합니다")
        }
        .padding(20)
        .background(CatchTheme.ink, in: RoundedRectangle(cornerRadius: 26))
        .foregroundStyle(.white)
        .overlay(alignment: .topTrailing) {
            Text("DAILY / 01")
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundStyle(.white.opacity(0.35))
                .padding(12)
        }
    }

    private var categorySummary: some View {
        VStack(spacing: 14) {
            SectionLabel(index: "02", title: "알아서 나눈 네 개의 맥락")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(CaptureCategory.allCases) { category in
                    Button {
                        store.searchText = category.title
                        store.selectedTab = 1
                    } label: {
                        CategoryTile(category: category, count: store.count(for: category))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var importPanel: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionLabel(index: "03", title: "내 스크린샷 연결")
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 15)
                        .fill(CatchTheme.coral)
                        .frame(width: 54, height: 54)
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.system(size: 23, weight: .bold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(store.isImporting ? "기기 안에서 읽는 중…" : "최근 7일 스크린샷 가져오기")
                        .font(.system(size: 15, weight: .bold))
                    Text("원본은 복사하거나 서버로 보내지 않아요")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(CatchTheme.mutedInk)
                }
                Spacer()
                Button {
                    Task { await store.requestPhotoAccessAndImport() }
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 17, weight: .black))
                        .frame(width: 44, height: 44)
                        .background(CatchTheme.ink, in: Circle())
                        .foregroundStyle(CatchTheme.paper)
                }
                .disabled(store.isImporting)
                .accessibilityLabel("사진 접근을 허용하고 스크린샷 가져오기")
            }
            .padding(16)
            .background(.white.opacity(0.55), in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(CatchTheme.line))
        }
    }

    private var privacyNote: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "lock.shield.fill")
                .foregroundStyle(CatchTheme.mutedInk)
            Text("분류와 글자 인식은 온디바이스로 처리합니다. Catch는 사진을 삭제하거나 공유하지 않으며, 행동은 항상 직접 확정합니다.")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(CatchTheme.mutedInk)
                .lineSpacing(3)
        }
        .padding(.horizontal, 4)
    }
}

private struct CategoryTile: View {
    let category: CaptureCategory
    let count: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: category.symbol)
                    .font(.system(size: 17, weight: .bold))
                    .frame(width: 36, height: 36)
                    .background(category.color.opacity(0.14), in: Circle())
                    .foregroundStyle(category.color)
                Spacer()
                Text(String(format: "%02d", count))
                    .font(.system(size: 20, weight: .black, design: .monospaced))
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(category.title)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                Text(category.subtitle)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(CatchTheme.mutedInk)
                    .lineLimit(1)
            }
        }
        .padding(15)
        .background(.white.opacity(0.68), in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(CatchTheme.line))
        .foregroundStyle(CatchTheme.ink)
    }
}

