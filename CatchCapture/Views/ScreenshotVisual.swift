import SwiftUI

struct ScreenshotVisual: View {
    let item: CatchItem
    @State private var loadedImage: UIImage?

    var body: some View {
        Group {
            if let loadedImage {
                Image(uiImage: loadedImage)
                    .resizable()
                    .scaledToFill()
            } else {
                SampleScreenshot(seed: item.visualSeed, category: item.category, compact: false)
            }
        }
        .clipped()
        .task(id: item.photoIdentifier) {
            guard let identifier = item.photoIdentifier else { return }
            loadedImage = await PhotoLibraryService.shared.requestThumbnail(
                identifier: identifier,
                size: CGSize(width: 900, height: 1400)
            )
        }
    }
}

struct ScreenshotMiniature: View {
    let item: CatchItem

    var body: some View {
        ScreenshotVisual(item: item)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white.opacity(0.5), lineWidth: 1))
            .shadow(color: .black.opacity(0.28), radius: 8, y: 5)
    }
}

private struct SampleScreenshot: View {
    let seed: Int
    let category: CaptureCategory
    let compact: Bool

    private var colors: [Color] {
        switch seed % 7 {
        case 0: [.indigo, .cyan]
        case 1: [.orange, .pink]
        case 2: [.purple, .blue]
        case 3: [.green, .mint]
        case 4: [.brown, .orange]
        case 5: [.pink, .purple]
        default: [.blue, .indigo]
        }
    }

    var body: some View {
        GeometryReader { proxy in
            VStack(spacing: compact ? 3 : 8) {
                HStack(spacing: 4) {
                    Circle().fill(.white.opacity(0.8)).frame(width: compact ? 5 : 10)
                    Capsule().fill(.white.opacity(0.55)).frame(width: proxy.size.width * 0.32, height: compact ? 3 : 7)
                    Spacer()
                    Circle().fill(.white.opacity(0.8)).frame(width: compact ? 5 : 10)
                }
                .padding(.horizontal, compact ? 5 : 12)
                .padding(.top, compact ? 6 : 12)

                RoundedRectangle(cornerRadius: compact ? 4 : 12)
                    .fill(.white.opacity(0.2))
                    .overlay {
                        Image(systemName: category.symbol)
                            .font(.system(size: compact ? 12 : 38, weight: .black))
                            .foregroundStyle(.white.opacity(0.9))
                    }
                    .padding(.horizontal, compact ? 5 : 12)

                VStack(alignment: .leading, spacing: compact ? 2 : 5) {
                    Capsule().fill(.white.opacity(0.9)).frame(width: proxy.size.width * 0.65, height: compact ? 3 : 8)
                    Capsule().fill(.white.opacity(0.55)).frame(width: proxy.size.width * 0.45, height: compact ? 2 : 6)
                    Capsule().fill(.white.opacity(0.35)).frame(height: compact ? 2 : 6)
                }
                .padding(.horizontal, compact ? 5 : 12)
                .padding(.bottom, compact ? 6 : 12)
            }
            .background(LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing))
        }
    }
}

