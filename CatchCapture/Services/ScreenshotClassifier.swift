import Foundation

struct ScreenshotClassifier {
    func classify(text rawText: String) -> ClassificationResult {
        let text = rawText.lowercased()

        if contains(text, anyOf: ["₩", "원", "장바구니", "구매", "할인", "sale", "price", "배송", "무료배송", "size", "사이즈"]) {
            return ClassificationResult(
                category: .shopping,
                intent: .want,
                title: headline(from: rawText, fallback: "마음에 든 상품"),
                summary: "가격과 상품 정보를 찾았어요"
            )
        }

        if contains(text, anyOf: ["breaking", "단독", "기자", "뉴스", "신문", "article", "속보", "경제", "정치", "사회", "입력 20", "수정 20"]) {
            return ClassificationResult(
                category: .news,
                intent: .share,
                title: headline(from: rawText, fallback: "공유하고 싶은 뉴스"),
                summary: "기사로 보이는 캡처예요"
            )
        }

        if contains(text, anyOf: ["like", "likes", "댓글", "공유", "팔로워", "reels", "instagram", "threads", "tiktok", "youtube", "조회수", "좋아요"]) {
            return ClassificationResult(
                category: .social,
                intent: .keep,
                title: headline(from: rawText, fallback: "기억하고 싶은 장면"),
                summary: "소셜 콘텐츠로 보이는 캡처예요"
            )
        }

        return ClassificationResult(
            category: .work,
            intent: .reference,
            title: headline(from: rawText, fallback: "새로운 레퍼런스"),
            summary: rawText.isEmpty ? "내용을 확인해 분류해 주세요" : "업무 참고 자료로 분류했어요"
        )
    }

    private func contains(_ text: String, anyOf keywords: [String]) -> Bool {
        keywords.contains(where: text.contains)
    }

    private func headline(from text: String, fallback: String) -> String {
        let candidate = text
            .split(whereSeparator: \Character.isNewline)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first { $0.count >= 4 }
        guard let candidate else { return fallback }
        return String(candidate.prefix(34))
    }
}

