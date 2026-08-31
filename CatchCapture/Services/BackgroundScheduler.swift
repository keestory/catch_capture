import BackgroundTasks
import Foundation

final class BackgroundScheduler {
    static let shared = BackgroundScheduler()
    static let refreshIdentifier = "com.catchcapture.app.refresh"
    static let processingIdentifier = "com.catchcapture.app.processing"

    private var isRegistered = false

    func register() {
        guard !isRegistered else { return }
        isRegistered = true

        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.refreshIdentifier, using: nil) { task in
            self.handle(task: task)
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.processingIdentifier, using: nil) { task in
            self.handle(task: task)
        }
    }

    func scheduleNextRun() {
        let calendar = Calendar.current
        let now = Date()
        let nextMorning = calendar.nextDate(
            after: now,
            matching: DateComponents(hour: 6, minute: 0),
            matchingPolicy: .nextTime
        ) ?? now.addingTimeInterval(8 * 60 * 60)

        let refresh = BGAppRefreshTaskRequest(identifier: Self.refreshIdentifier)
        refresh.earliestBeginDate = nextMorning
        try? BGTaskScheduler.shared.submit(refresh)

        let processing = BGProcessingTaskRequest(identifier: Self.processingIdentifier)
        processing.requiresExternalPower = false
        processing.requiresNetworkConnectivity = false
        processing.earliestBeginDate = nextMorning
        try? BGTaskScheduler.shared.submit(processing)
    }

    private func handle(task: BGTask) {
        scheduleNextRun()
        let work = Task { @MainActor in
            let store = CaptureStore()
            await store.refreshFromPhotoLibrary()
            task.setTaskCompleted(success: true)
        }
        task.expirationHandler = {
            work.cancel()
            task.setTaskCompleted(success: false)
        }
    }
}

