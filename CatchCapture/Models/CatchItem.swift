import Foundation
import SwiftUI

enum CaptureCategory: String, Codable, CaseIterable, Identifiable {
    case work
    case shopping
    case social
    case news

    var id: String { rawValue }

    var title: String {
        switch self {
        case .work: "회사"
        case .shopping: "쇼핑"
        case .social: "소셜"
        case .news: "뉴스"
        }
    }

    var subtitle: String {
        switch self {
        case .work: "레퍼런스로 보관"
        case .shopping: "위시리스트에 담기"
        case .social: "공유하거나 간직하기"
        case .news: "읽고 전달하기"
        }
    }

    var symbol: String {
        switch self {
        case .work: "rectangle.3.group.fill"
        case .shopping: "bag.fill"
        case .social: "bubble.left.and.bubble.right.fill"
        case .news: "newspaper.fill"
        }
    }

    var color: Color {
        switch self {
        case .work: Color(red: 0.19, green: 0.34, blue: 0.96)
        case .shopping: Color(red: 0.90, green: 0.30, blue: 0.22)
        case .social: Color(red: 0.47, green: 0.26, blue: 0.78)
        case .news: Color(red: 0.06, green: 0.47, blue: 0.37)
        }
    }
}

enum CaptureIntent: String, Codable, CaseIterable {
    case reference
    case want
    case share
    case keep
    case readLater

    var title: String {
        switch self {
        case .reference: "참고하기"
        case .want: "사고 싶어요"
        case .share: "공유하기"
        case .keep: "간직하기"
        case .readLater: "나중에 읽기"
        }
    }
}

struct CatchItem: Identifiable, Codable, Equatable {
    let id: UUID
    var photoIdentifier: String?
    var capturedAt: Date
    var category: CaptureCategory
    var intent: CaptureIntent
    var title: String
    var summary: String
    var recognizedText: String
    var isReviewed: Bool
    var isSample: Bool
    var visualSeed: Int

    init(
        id: UUID = UUID(),
        photoIdentifier: String? = nil,
        capturedAt: Date = .now,
        category: CaptureCategory,
        intent: CaptureIntent,
        title: String,
        summary: String,
        recognizedText: String = "",
        isReviewed: Bool = false,
        isSample: Bool = false,
        visualSeed: Int = 0
    ) {
        self.id = id
        self.photoIdentifier = photoIdentifier
        self.capturedAt = capturedAt
        self.category = category
        self.intent = intent
        self.title = title
        self.summary = summary
        self.recognizedText = recognizedText
        self.isReviewed = isReviewed
        self.isSample = isSample
        self.visualSeed = visualSeed
    }
}

struct ClassificationResult: Equatable {
    let category: CaptureCategory
    let intent: CaptureIntent
    let title: String
    let summary: String
}

