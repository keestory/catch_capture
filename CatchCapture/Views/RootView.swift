import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: CaptureStore

    var body: some View {
        TabView(selection: $store.selectedTab) {
            NavigationStack {
                HomeView()
            }
            .tabItem { Label("오늘", systemImage: "sparkles.rectangle.stack.fill") }
            .tag(0)

            NavigationStack {
                LibraryView()
            }
            .tabItem { Label("보관함", systemImage: "square.grid.2x2.fill") }
            .tag(1)

            NavigationStack {
                SettingsView()
            }
            .tabItem { Label("설정", systemImage: "slider.horizontal.3") }
            .tag(2)
        }
        .tint(CatchTheme.ink)
    }
}

