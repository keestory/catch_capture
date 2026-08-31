import SwiftUI

struct SettingsView: View {
    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack {
                        CatchWordmark()
                        Spacer()
                        Text("SETTINGS")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(CatchTheme.mutedInk)
                    }
                    Text("정리는 조용하게,\n결정은 내가.")
                        .font(.system(size: 32, weight: .black, design: .rounded))
                        .tracking(-1.2)

                    SettingsCard(
                        symbol: "clock.fill",
                        title: "매일 오후 9시",
                        detail: "리뷰 알림 · 시스템 상황에 따라 미리 분류"
                    )
                    SettingsCard(
                        symbol: "iphone.gen3.radiowaves.left.and.right",
                        title: "온디바이스 분석",
                        detail: "이미지와 OCR 텍스트를 서버로 보내지 않음"
                    )
                    SettingsCard(
                        symbol: "photo.stack.fill",
                        title: "원본은 사진 앱에",
                        detail: "Catch에는 분류와 원본 식별자만 저장"
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        SectionLabel(index: "PRIVACY", title: "지켜야 할 약속")
                        Text("• 회사 캡처를 포함한 모든 분석은 기본적으로 기기 안에서 끝납니다.\n• 원본 삭제, 공유, 구매 이동은 자동으로 실행하지 않습니다.\n• iOS는 정확한 시각의 백그라운드 실행을 보장하지 않아, 알림을 열 때 최신 내용을 다시 확인합니다.")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(CatchTheme.mutedInk)
                            .lineSpacing(6)
                    }
                    .padding(18)
                    .background(.white.opacity(0.6), in: RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(CatchTheme.line))
                }
                .padding(20)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

private struct SettingsCard: View {
    let symbol: String
    let title: String
    let detail: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .bold))
                .frame(width: 44, height: 44)
                .background(CatchTheme.ink, in: RoundedRectangle(cornerRadius: 13))
                .foregroundStyle(CatchTheme.acid)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .bold))
                Text(detail)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(CatchTheme.mutedInk)
            }
            Spacer()
        }
        .padding(15)
        .background(.white.opacity(0.6), in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(CatchTheme.line))
    }
}

