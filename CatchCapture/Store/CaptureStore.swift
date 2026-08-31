import Foundation
import Photos

@MainActor
final class CaptureStore: ObservableObject {
    @Published private(set) var items: [CatchItem] = []
    @Published var selectedTab = 0
    @Published var isImporting = false
    @Published var importMessage: String?
    @Published var searchText = ""

    private let storageKey = "catch.items.v1"
    private let lastImportKey = "catch.lastImportDate"
    private let classifier = ScreenshotClassifier()
    private let photoLibrary = PhotoLibraryService.shared

    init() {
        load()
    }

    var reviewQueue: [CatchItem] {
        items.filter { !$0.isReviewed }.sorted { $0.capturedAt > $1.capturedAt }
    }

    var reviewedItems: [CatchItem] {
        items.filter(\.isReviewed).sorted { $0.capturedAt > $1.capturedAt }
    }

    var isShowingSamples: Bool {
        items.contains(where: \.isSample)
    }

    func count(for category: CaptureCategory) -> Int {
        items.filter { $0.category == category }.count
    }

    func item(with id: UUID) -> CatchItem? {
        items.first { $0.id == id }
    }

    func markReviewed(_ id: UUID, category: CaptureCategory, intent: CaptureIntent) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].category = category
        items[index].intent = intent
        items[index].isReviewed = true
        persist()
    }

    func undoReview(_ id: UUID) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].isReviewed = false
        persist()
    }

    func updateCategory(_ id: UUID, category: CaptureCategory) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        items[index].category = category
        persist()
    }

    func deleteMetadata(_ id: UUID) {
        items.removeAll { $0.id == id }
        persist()
    }

    func requestPhotoAccessAndImport() async {
        let status = await photoLibrary.requestAuthorization()
        guard status == .authorized || status == .limited else {
            importMessage = "사진 접근이 필요해요. 설정에서 스크린샷 접근을 허용해 주세요."
            return
        }
        await NotificationScheduler.shared.requestPermissionIfNeeded()
        NotificationScheduler.shared.scheduleDailyReview(hour: 21)
        await refreshFromPhotoLibrary(replacingSamples: true)
    }

    func refreshFromPhotoLibrary(replacingSamples: Bool = false) async {
        let status = photoLibrary.authorizationStatus
        guard status == .authorized || status == .limited else { return }
        guard !isImporting else { return }

        isImporting = true
        defer { isImporting = false }

        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: .now) ?? .now
        let lastImport = UserDefaults.standard.object(forKey: lastImportKey) as? Date ?? sevenDaysAgo
        let imported = await photoLibrary.fetchScreenshots(since: lastImport)
        let knownIdentifiers = Set(items.compactMap(\.photoIdentifier))
        let newScreenshots = imported.filter { !knownIdentifiers.contains($0.localIdentifier) }

        if replacingSamples, !newScreenshots.isEmpty {
            items.removeAll(where: \.isSample)
        }

        let classified = newScreenshots.map { screenshot -> CatchItem in
            let result = classifier.classify(text: screenshot.recognizedText)
            return CatchItem(
                photoIdentifier: screenshot.localIdentifier,
                capturedAt: screenshot.capturedAt,
                category: result.category,
                intent: result.intent,
                title: result.title,
                summary: result.summary,
                recognizedText: screenshot.recognizedText,
                visualSeed: abs(screenshot.localIdentifier.hashValue % 7)
            )
        }
        items.append(contentsOf: classified)
        UserDefaults.standard.set(Date(), forKey: lastImportKey)
        persist()

        importMessage = classified.isEmpty
            ? "새로운 스크린샷이 없어요."
            : "스크린샷 \(classified.count)장을 기기 안에서 정리했어요."
    }

    private func load() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let decoded = try? JSONDecoder().decode([CatchItem].self, from: data),
           !decoded.isEmpty {
            items = decoded
        } else {
            items = Self.samples
        }
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(items) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }

    static let samples: [CatchItem] = [
        CatchItem(category: .work, intent: .reference, title: "온보딩 카피 레퍼런스", summary: "경쟁 앱의 첫 화면 구조", isSample: true, visualSeed: 0),
        CatchItem(category: .shopping, intent: .want, title: "오프화이트 러너 스니커즈", summary: "129,000원 · 무료배송", isSample: true, visualSeed: 1),
        CatchItem(category: .social, intent: .share, title: "팀에 보내고 싶은 밈", summary: "월요일 회의에 대한 정확한 묘사", isSample: true, visualSeed: 2),
        CatchItem(category: .news, intent: .readLater, title: "AI 검색이 바꾸는 쇼핑", summary: "5분 분량 · 테크", isSample: true, visualSeed: 3),
        CatchItem(category: .shopping, intent: .want, title: "작은 원목 사이드 테이블", summary: "집에 어울릴 것 같아요", isSample: true, visualSeed: 4),
        CatchItem(category: .social, intent: .keep, title: "오래 기억하고 싶은 문장", summary: "오늘의 마음에 닿은 장면", isSample: true, visualSeed: 5),
        CatchItem(category: .work, intent: .reference, title: "가격 비교 UI 패턴", summary: "모바일 카드 레이아웃", isSample: true, visualSeed: 6),
        CatchItem(category: .news, intent: .share, title: "새로운 로컬 브랜드 이야기", summary: "동료에게 공유하기", isSample: true, visualSeed: 0)
    ]
}
