import XCTest
@testable import CatchCapture

final class ScreenshotClassifierTests: XCTestCase {
    private let classifier = ScreenshotClassifier()

    func testShoppingClassificationFromKoreanPrice() {
        let result = classifier.classify(text: "오프화이트 러너\n129,000원\n무료배송\n장바구니")
        XCTAssertEqual(result.category, .shopping)
        XCTAssertEqual(result.intent, .want)
    }

    func testNewsClassificationFromArticleSignals() {
        let result = classifier.classify(text: "AI 검색이 바꾸는 쇼핑\n김캐치 기자\n입력 2026.08.20")
        XCTAssertEqual(result.category, .news)
        XCTAssertEqual(result.intent, .share)
    }

    func testSocialClassificationFromEngagementSignals() {
        let result = classifier.classify(text: "좋아요 2,312개\n댓글 43개\n공유")
        XCTAssertEqual(result.category, .social)
        XCTAssertEqual(result.intent, .keep)
    }

    func testUnknownFallsBackToReviewableWorkReference() {
        let result = classifier.classify(text: "새로운 모바일 카드 레이아웃")
        XCTAssertEqual(result.category, .work)
        XCTAssertEqual(result.intent, .reference)
    }
}
