import XCTest

final class CatchCaptureUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testCompletesDailyReviewFlow() throws {
        let app = XCUIApplication()
        app.launch()

        let startButton = app.buttons["8장 정리 시작"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 5))
        startButton.tap()

        let workButton = app.buttons["회사로 정리"]
        XCTAssertTrue(workButton.waitForExistence(timeout: 5))

        for _ in 0..<8 {
            XCTAssertTrue(workButton.waitForExistence(timeout: 2))
            workButton.tap()
        }

        XCTAssertTrue(app.staticTexts["오늘 정리, 끝!"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["완료"].exists)
    }
}
