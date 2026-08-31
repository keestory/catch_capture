import SwiftUI

enum CatchTheme {
    static let paper = Color(red: 0.96, green: 0.94, blue: 0.89)
    static let ink = Color(red: 0.08, green: 0.09, blue: 0.08)
    static let mutedInk = Color(red: 0.34, green: 0.34, blue: 0.31)
    static let acid = Color(red: 0.88, green: 0.96, blue: 0.28)
    static let coral = Color(red: 0.95, green: 0.34, blue: 0.22)
    static let line = Color.black.opacity(0.12)
}

struct PaperBackground: View {
    var body: some View {
        CatchTheme.paper
            .overlay {
                Canvas { context, size in
                    for x in stride(from: 0.0, through: size.width, by: 18) {
                        for y in stride(from: 0.0, through: size.height, by: 18) {
                            context.fill(
                                Path(ellipseIn: CGRect(x: x, y: y, width: 1.3, height: 1.3)),
                                with: .color(.black.opacity(0.045))
                            )
                        }
                    }
                }
            }
            .ignoresSafeArea()
    }
}

struct CatchWordmark: View {
    var body: some View {
        HStack(spacing: 7) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(CatchTheme.ink)
                    .frame(width: 32, height: 32)
                Image(systemName: "viewfinder")
                    .font(.system(size: 17, weight: .black))
                    .foregroundStyle(CatchTheme.acid)
            }
            Text("CATCH")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .tracking(-0.5)
        }
        .foregroundStyle(CatchTheme.ink)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Catch")
    }
}

struct SectionLabel: View {
    let index: String
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Text(index)
                .font(.system(size: 11, weight: .black, design: .monospaced))
                .padding(.horizontal, 7)
                .padding(.vertical, 4)
                .background(CatchTheme.ink)
                .foregroundStyle(CatchTheme.paper)
            Text(title.uppercased())
                .font(.system(size: 13, weight: .black, design: .rounded))
                .tracking(1.1)
            Spacer()
            Rectangle()
                .fill(CatchTheme.ink)
                .frame(width: 30, height: 2)
        }
        .foregroundStyle(CatchTheme.ink)
    }
}

