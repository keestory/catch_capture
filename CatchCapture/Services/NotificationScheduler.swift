import Foundation
import UserNotifications

final class NotificationScheduler {
    static let shared = NotificationScheduler()
    private let center = UNUserNotificationCenter.current()

    func requestPermissionIfNeeded() async {
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .notDetermined else { return }
        _ = try? await center.requestAuthorization(options: [.alert, .badge, .sound])
    }

    func scheduleDailyReview(hour: Int) {
        center.removePendingNotificationRequests(withIdentifiers: ["catch.daily-review"])

        let content = UNMutableNotificationContent()
        content.title = "오늘의 캡처를 정리할 시간"
        content.body = "몇 장만 넘기면 내일의 사진함이 가벼워져요."
        content.sound = .default

        let trigger = UNCalendarNotificationTrigger(
            dateMatching: DateComponents(hour: hour, minute: 0),
            repeats: true
        )
        let request = UNNotificationRequest(
            identifier: "catch.daily-review",
            content: content,
            trigger: trigger
        )
        center.add(request)
    }
}

